const express = require('express');
const {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  getAllPayments,
  refundPayment
} = require('../controllers/payments');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/create-order')
  .post(protect, createOrder);

router.route('/verify')
  .post(protect, verifyPayment);

router.route('/:id')
  .get(protect, getPaymentDetails);

router.route('/')
  .get(protect, authorize('admin'), getAllPayments);

router.route('/:id/refund')
  .post(protect, authorize('admin'), refundPayment);

module.exports = router;