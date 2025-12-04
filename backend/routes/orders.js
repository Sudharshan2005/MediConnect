const express = require('express');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  getMyOrders,
  updateOrderStatus
} = require('../controllers/orders');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, authorize('admin'), getOrders)
  .post(protect, createOrder);

router.route('/myorders')
  .get(protect, getMyOrders);

router.route('/:id')
  .get(protect, getOrder)
  .put(protect, updateOrder)
  .delete(protect, authorize('admin'), deleteOrder);

router.route('/:id/status')
  .put(protect, authorize('admin', 'pharmacist'), updateOrderStatus);

module.exports = router;