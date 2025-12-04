const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});

// @desc    Create Razorpay order
// @route   POST /api/v1/payments/create-order
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    const options = {
      amount: amount * 100, // Amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      }
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(400).json({
      success: false,
      error: 'Failed to create payment order'
    });
  }
};

// @desc    Verify payment
// @route   POST /api/v1/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature'
      });
    }

    // Create payment record
    const payment = await Payment.create({
      order: req.body.orderDbId,
      paymentId,
      signature,
      amount: req.body.amount,
      currency: 'INR',
      status: 'completed'
    });

    // Update order status
    await Order.findByIdAndUpdate(req.body.orderDbId, {
      paymentStatus: 'completed',
      paymentId: payment._id
    });

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(400).json({
      success: false,
      error: 'Payment verification failed'
    });
  }
};

// @desc    Get payment details
// @route   GET /api/v1/payments/:id
// @access  Private
exports.getPaymentDetails = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get all payments
// @route   GET /api/v1/payments
// @access  Private/Admin
exports.getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('order')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Refund payment
// @route   POST /api/v1/payments/:id/refund
// @access  Private/Admin
exports.refundPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Create Razorpay refund
    const refund = await razorpay.payments.refund(payment.paymentId, {
      amount: payment.amount
    });

    // Update payment status
    payment.status = 'refunded';
    await payment.save();

    // Update order status
    await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: 'refunded'
    });

    res.status(200).json({
      success: true,
      data: refund
    });
  } catch (err) {
    console.error('Error processing refund:', err);
    res.status(400).json({
      success: false,
      error: 'Refund failed'
    });
  }
};