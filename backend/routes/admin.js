const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  approveDoctor,
  getDashboardStats,
  getAnalytics
} = require('../controllers/admin');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/users')
  .get(protect, authorize('admin'), getUsers);

router.route('/users/:id')
  .get(protect, authorize('admin'), getUser)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

router.route('/doctors/:id/approve')
  .put(protect, authorize('admin'), approveDoctor);

router.route('/dashboard/stats')
  .get(protect, authorize('admin'), getDashboardStats);

router.route('/analytics')
  .get(protect, authorize('admin'), getAnalytics);

module.exports = router;