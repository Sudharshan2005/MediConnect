const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  medicines: [{
    name: {
      type: String,
      required: true
    },
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    quantity: Number
  }],
  diagnosis: String,
  notes: String,
  followUpDate: Date,
  issuedDate: {
    type: Date,
    default: Date.now
  },
  isDigital: {
    type: Boolean,
    default: true
  },
  signature: String,
  status: {
    type: String,
    enum: ['active', 'expired', 'fulfilled'],
    default: 'active'
  }
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);