const express = require('express');
const {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorAppointments,
  updateAvailability,
  updateDoctorProfile,
  getDoctorDashboard,
  searchDoctors
} = require('../controllers/doctors');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getDoctors)
  .post(protect, authorize('admin'), createDoctor);

router.route('/search').get(searchDoctors);

router.route('/:id')
  .get(getDoctor)
  .put(protect, authorize('doctor', 'admin'), updateDoctor)
  .delete(protect, authorize('admin'), deleteDoctor);

router.route('/:id/appointments')
  .get(protect, authorize('doctor', 'admin'), getDoctorAppointments);

router.route('/:id/availability')
  .put(protect, authorize('doctor'), updateAvailability);

router.route('/profile/update')
  .put(protect, authorize('doctor'), updateDoctorProfile);

router.route('/dashboard/stats')
  .get(protect, authorize('doctor'), getDoctorDashboard);

module.exports = router;