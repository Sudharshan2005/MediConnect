const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// @desc    Get all doctors
// @route   GET /api/v1/doctors
// @access  Public
exports.getDoctors = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Doctor.find(JSON.parse(queryStr)).populate({
      path: 'user',
      select: 'name email phone profileImage'
    });

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Doctor.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const doctors = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: doctors.length,
      pagination,
      data: doctors
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Search doctors
// @route   GET /api/v1/doctors/search
// @access  Public
exports.searchDoctors = async (req, res, next) => {
  try {
    const { specialization, name, location, rating } = req.query;
    let query = {};

    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    if (name) {
      const users = await User.find({
        name: { $regex: name, $options: 'i' },
        role: 'doctor'
      });
      const userIds = users.map(user => user._id);
      query.user = { $in: userIds };
    }

    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    const doctors = await Doctor.find(query)
      .populate({
        path: 'user',
        select: 'name email phone profileImage address'
      })
      .sort('-rating');

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single doctor
// @route   GET /api/v1/doctors/:id
// @access  Public
exports.getDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate({
      path: 'user',
      select: 'name email phone profileImage address dateOfBirth gender'
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    // Get available slots for next 7 days
    const availableSlots = await getAvailableSlots(doctor._id);

    res.status(200).json({
      success: true,
      data: {
        ...doctor.toObject(),
        availableSlots
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Helper function to get available slots
const getAvailableSlots = async (doctorId) => {
  const doctor = await Doctor.findById(doctorId);
  const slots = [];

  // Generate slots for next 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    if (doctor.availableDays.includes(dayName)) {
      const daySlots = doctor.availableSlots.find(slot => slot.day === dayName);
      if (daySlots) {
        slots.push({
          date: date.toISOString().split('T')[0],
          day: dayName,
          slots: daySlots.slots.filter(slot => slot.isAvailable)
        });
      }
    }
  }

  return slots;
};

// @desc    Create doctor
// @route   POST /api/v1/doctors
// @access  Private/Admin
exports.createDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.create(req.body);

    res.status(201).json({
      success: true,
      data: doctor
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update doctor
// @route   PUT /api/v1/doctors/:id
// @access  Private/Doctor/Admin
exports.updateDoctor = async (req, res, next) => {
  try {
    let doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update doctor availability
// @route   PUT /api/v1/doctors/:id/availability
// @access  Private/Doctor
exports.updateAvailability = async (req, res, next) => {
  try {
    const { availableDays, availableSlots } = req.body;
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    doctor.availableDays = availableDays || doctor.availableDays;
    doctor.availableSlots = availableSlots || doctor.availableSlots;

    await doctor.save();

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get doctor appointments
// @route   GET /api/v1/doctors/:id/appointments
// @access  Private/Doctor
exports.getDoctorAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ doctor: req.params.id })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      })
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

// @desc    Update doctor profile
// @route   PUT /api/v1/doctors/profile/update
// @access  Private/Doctor
exports.updateDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    // Update doctor fields
    const fieldsToUpdate = {
      specialization: req.body.specialization,
      qualifications: req.body.qualifications,
      experience: req.body.experience,
      hospital: req.body.hospital,
      consultationFee: req.body.consultationFee,
      consultationTypes: req.body.consultationTypes,
      languages: req.body.languages
    };

    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] !== undefined) {
        doctor[key] = fieldsToUpdate[key];
      }
    });

    await doctor.save();

    // Update user fields
    const user = await User.findById(req.user.id);
    const userFields = {
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address
    };

    Object.keys(userFields).forEach(key => {
      if (userFields[key] !== undefined) {
        user[key] = userFields[key];
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        doctor,
        user
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get doctor dashboard stats
// @route   GET /api/v1/doctors/dashboard/stats
// @access  Private/Doctor
exports.getDoctorDashboard = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get appointments statistics
    const totalAppointments = await Appointment.countDocuments({ doctor: doctor._id });
    const monthlyAppointments = await Appointment.countDocuments({
      doctor: doctor._id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const upcomingAppointments = await Appointment.countDocuments({
      doctor: doctor._id,
      date: { $gte: now },
      status: 'confirmed'
    });
    const completedAppointments = await Appointment.countDocuments({
      doctor: doctor._id,
      status: 'completed'
    });

    // Get revenue statistics
    const monthlyRevenue = await Appointment.aggregate([
      {
        $match: {
          doctor: doctor._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
          isPaid: true
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: doctor.consultationFee }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalAppointments,
        monthlyAppointments,
        upcomingAppointments,
        completedAppointments,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        rating: doctor.rating,
        totalRatings: doctor.totalRatings
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Add this function at the end of the file
// @desc    Delete doctor
// @route   DELETE /api/v1/doctors/:id
// @access  Private/Admin
exports.deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    // Delete associated user
    await User.findByIdAndDelete(doctor.user);

    await doctor.remove();

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