const Order = require('../models/Order');
const Patient = require('../models/Patient');

// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Private/Admin
exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      })
      .populate('prescription')
      .populate('items.medicine');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Create order
// @route   POST /api/v1/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    const order = await Order.create({
      ...req.body,
      patient: patient._id
    });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update order
// @route   PUT /api/v1/orders/:id
// @access  Private
exports.updateOrder = async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/v1/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    await order.remove();

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

// @desc    Get my orders
// @route   GET /api/v1/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    const orders = await Order.find({ patient: patient._id })
      .populate('prescription')
      .populate('items.medicine')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/v1/orders/:id/status
// @access  Private/Admin/Pharmacist
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    order.orderStatus = orderStatus;
    
    if (orderStatus === 'delivered') {
      order.deliveredAt = Date.now();
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};