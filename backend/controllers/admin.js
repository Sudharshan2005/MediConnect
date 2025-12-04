const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Order = require('../models/Order');

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort('-createdAt');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/v1/admin/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/v1/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete associated profile
    if (user.role === 'doctor') {
      await Doctor.findOneAndDelete({ user: user._id });
    } else if (user.role === 'patient') {
      await Patient.findOneAndDelete({ user: user._id });
    }

    await user.remove();

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

// @desc    Approve doctor
// @route   PUT /api/v1/admin/doctors/:id/approve
// @access  Private/Admin
exports.approveDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    doctor.isVerified = true;
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

// @desc    Get dashboard stats
// @route   GET /api/v1/admin/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      totalOrders,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$finalAmount' }
          }
        }
      ])
    ]);

    // Recent data
    const recentUsers = await User.find()
      .sort('-createdAt')
      .limit(5);
    
    const recentOrders = await Order.find()
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name'
        }
      })
      .sort('-createdAt')
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalDoctors,
          totalPatients,
          totalAppointments,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        recentUsers,
        recentOrders
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get analytics
// @route   GET /api/v1/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Monthly appointments
    const monthlyAppointments = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Monthly revenue
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: '$finalAmount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Doctor specializations
    const doctorSpecializations = await Doctor.aggregate([
      {
        $group: {
          _id: '$specialization',
          count: { $sum: 1 }
        }
      }
    ]);

    // Order status distribution
    const orderStatusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        monthlyAppointments,
        monthlyRevenue,
        doctorSpecializations,
        orderStatusDistribution
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};