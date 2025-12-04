const express = require('express');
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getPatientAppointments,
  updateAppointmentStatus,
  checkAvailability,
  createVideoAppointment,
  getUpcomingAppointments
} = require('../controllers/appointments');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getAppointments)
  .post(protect, createAppointment);

router.route('/availability').post(checkAvailability);

router.route('/video').post(protect, createVideoAppointment);

router.route('/upcoming')
  .get(protect, getUpcomingAppointments);

router.route('/patient/:patientId')
  .get(protect, getPatientAppointments);

router.route('/:id')
  .get(protect, getAppointment)
  .put(protect, updateAppointment)
  .delete(protect, deleteAppointment);  // Make sure deleteAppointment function exists

router.route('/:id/status')
  .put(protect, updateAppointmentStatus);

module.exports = router;