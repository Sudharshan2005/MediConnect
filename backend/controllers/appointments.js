const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');

// @desc    Get all appointments
// @route   GET /api/v1/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
  try {
    let query;

    // If user is not admin, only show their appointments
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      query = Appointment.find({ patient: patient._id });
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      query = Appointment.find({ doctor: doctor._id });
    } else {
      query = Appointment.find();
    }

    // Populate
    query = query
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      })
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email phone profileImage'
        }
      })
      .populate('prescription')
      .sort('-date');

    const appointments = await query;

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/v1/appointments/:id
// @access  Private
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email phone dateOfBirth gender'
        }
      })
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email phone profileImage'
        }
      })
      .populate('prescription');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    // Make sure user is authorized
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (appointment.patient._id.toString() !== patient._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized'
        });
      }
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (appointment.doctor._id.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Create appointment
// @route   POST /api/v1/appointments
// @access  Private
exports.createAppointment = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    // Check if slot is available
    const isAvailable = await checkSlotAvailability(
      req.body.doctor,
      req.body.date,
      req.body.timeSlot
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Selected slot is not available'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      ...req.body,
      patient: patient._id
    });

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/v1/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res, next) => {
  try {
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    // Check authorization
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (appointment.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized'
        });
      }
    }

    appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update appointment status
// @route   PUT /api/v1/appointments/:id/status
// @access  Private
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    // Check authorization
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (appointment.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized'
        });
      }
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Check slot availability
// @route   POST /api/v1/appointments/availability
// @access  Public
exports.checkAvailability = async (req, res, next) => {
  try {
    const { doctorId, date, timeSlot } = req.body;

    const isAvailable = await checkSlotAvailability(doctorId, date, timeSlot);

    res.status(200).json({
      success: true,
      available: isAvailable
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Helper function to check slot availability
const checkSlotAvailability = async (doctorId, date, timeSlot) => {
  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    return false;
  }

  // Check if doctor is available on that day
  const appointmentDate = new Date(date);
  const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  if (!doctor.availableDays.includes(dayName)) {
    return false;
  }

  // Check if slot is in available slots
  const daySlots = doctor.availableSlots.find(slot => slot.day === dayName);
  if (!daySlots) {
    return false;
  }

  const slotAvailable = daySlots.slots.some(slot =>
    slot.startTime === timeSlot.startTime &&
    slot.endTime === timeSlot.endTime &&
    slot.isAvailable
  );

  if (!slotAvailable) {
    return false;
  }

  // Check if slot is already booked
  const existingAppointment = await Appointment.findOne({
    doctor: doctorId,
    date: appointmentDate,
    'timeSlot.startTime': timeSlot.startTime,
    'timeSlot.endTime': timeSlot.endTime,
    status: { $in: ['pending', 'confirmed'] }
  });

  return !existingAppointment;
};

// @desc    Get patient appointments
// @route   GET /api/v1/appointments/patient/:patientId
// @access  Private
exports.getPatientAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patient: req.params.patientId })
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email phone profileImage'
        }
      })
      .populate('prescription')
      .sort('-date');

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get upcoming appointments
// @route   GET /api/v1/appointments/upcoming
// @access  Private
exports.getUpcomingAppointments = async (req, res, next) => {
  try {
    let query;
    const now = new Date();

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      query = Appointment.find({
        patient: patient._id,
        date: { $gte: now },
        status: { $in: ['pending', 'confirmed'] }
      });
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      query = Appointment.find({
        doctor: doctor._id,
        date: { $gte: now },
        status: { $in: ['pending', 'confirmed'] }
      });
    } else {
      query = Appointment.find({
        date: { $gte: now },
        status: { $in: ['pending', 'confirmed'] }
      });
    }

    const appointments = await query
      .populate({
        path: req.user.role === 'patient' ? 'doctor' : 'patient',
        populate: {
          path: 'user',
          select: 'name email phone profileImage'
        }
      })
      .sort('date')
      .limit(10);

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Create video appointment
// @route   POST /api/v1/appointments/video
// @access  Private
exports.createVideoAppointment = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    // Generate meeting ID and link (using Jitsi Meet API)
    const meetingId = `mediconnect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const meetingLink = `https://meet.jit.si/${meetingId}`;

    const appointment = await Appointment.create({
      ...req.body,
      patient: patient._id,
      consultationType: 'video',
      meetingLink,
      meetingId
    });

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Add this function to the appointments controller
// @desc    Delete appointment
// @route   DELETE /api/v1/appointments/:id
// @access  Private
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    // Check authorization
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (appointment.patient.toString() !== patient._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this appointment'
        });
      }
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (appointment.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this appointment'
        });
      }
    }

    await appointment.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

