const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// @desc    Get all prescriptions
// @route   GET /api/v1/prescriptions
// @access  Private
exports.getPrescriptions = async (req, res, next) => {
  try {
    let query;

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      query = Prescription.find({ patient: patient._id });
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      query = Prescription.find({ doctor: doctor._id });
    } else {
      query = Prescription.find();
    }

    const prescriptions = await query
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
      .populate('appointment')
      .sort('-issuedDate');

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single prescription
// @route   GET /api/v1/prescriptions/:id
// @access  Private
exports.getPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
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
      .populate('appointment');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Create prescription
// @route   POST /api/v1/prescriptions
// @access  Private/Doctor
exports.createPrescription = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    const prescription = await Prescription.create({
      ...req.body,
      doctor: doctor._id
    });

    // Update appointment with prescription reference
    if (req.body.appointment) {
      await Appointment.findByIdAndUpdate(req.body.appointment, {
        prescription: prescription._id
      });
    }

    res.status(201).json({
      success: true,
      data: prescription
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update prescription
// @route   PUT /api/v1/prescriptions/:id
// @access  Private/Doctor
exports.updatePrescription = async (req, res, next) => {
  try {
    let prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
    }

    prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete prescription
// @route   DELETE /api/v1/prescriptions/:id
// @access  Private/Doctor
exports.deletePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
    }

    // Check if user is authorized (doctor who created it or admin)
    const doctor = await Doctor.findOne({ user: req.user.id });
    
    if (req.user.role === 'doctor') {
      if (prescription.doctor.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this prescription'
        });
      }
    }

    await prescription.remove();

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

// @desc    Get patient prescriptions
// @route   GET /api/v1/prescriptions/patient/:patientId
// @access  Private
exports.getPatientPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.params.patientId })
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'name email phone profileImage'
        }
      })
      .populate('appointment')
      .sort('-issuedDate');

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get doctor prescriptions
// @route   GET /api/v1/prescriptions/doctor/:doctorId
// @access  Private
exports.getDoctorPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ doctor: req.params.doctorId })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      })
      .populate('appointment')
      .sort('-issuedDate');

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Upload prescription image
// @route   POST /api/v1/prescriptions/upload
// @access  Private/Patient
exports.uploadPrescriptionImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a file'
      });
    }

    const patient = await Patient.findOne({ user: req.user.id });

    const prescription = await Prescription.create({
      patient: patient._id,
      isDigital: false,
      image: req.file.path,
      status: 'pending'
    });

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Verify prescription
// @route   PUT /api/v1/prescriptions/verify/:id
// @access  Private/Pharmacist
exports.verifyPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
    }

    prescription.status = 'verified';
    await prescription.save();

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Generate e-prescription
// @route   POST /api/v1/prescriptions/generate/:appointmentId
// @access  Private/Doctor
exports.generateEprescription = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    const doctor = await Doctor.findOne({ user: req.user.id });

    const prescription = await Prescription.create({
      appointment: appointment._id,
      patient: appointment.patient,
      doctor: doctor._id,
      medicines: req.body.medicines,
      diagnosis: req.body.diagnosis,
      notes: req.body.notes,
      followUpDate: req.body.followUpDate,
      isDigital: true,
      status: 'active'
    });

    // Update appointment
    appointment.prescription = prescription._id;
    await appointment.save();

    res.status(201).json({
      success: true,
      data: prescription
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};