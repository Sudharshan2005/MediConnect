const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null]
  },
  height: {
    type: Number
  },
  weight: {
    type: Number
  },
  allergies: [String],
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    status: String
  }],
  currentMedications: [{
    medicine: String,
    dosage: String,
    frequency: String
  }],
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Patient', PatientSchema);