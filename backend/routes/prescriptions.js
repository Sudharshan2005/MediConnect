const express = require('express');
const {
  getPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  uploadPrescriptionImage,
  verifyPrescription,
  generateEprescription
} = require('../controllers/prescriptions');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getPrescriptions)
  .post(authorize('doctor'), createPrescription);

router.route('/patient/:patientId')
  .get(getPatientPrescriptions);

router.route('/doctor/:doctorId')
  .get(getDoctorPrescriptions);

router.route('/upload')
  .post(authorize('patient'), upload.single('prescription'), uploadPrescriptionImage);

router.route('/verify/:id')
  .put(authorize('pharmacist'), verifyPrescription);

router.route('/generate/:appointmentId')
  .post(authorize('doctor'), generateEprescription);

router.route('/:id')
  .get(getPrescription)
  .put(authorize('doctor'), updatePrescription)
  .delete(authorize('doctor'), deletePrescription);  // This was missing

module.exports = router;