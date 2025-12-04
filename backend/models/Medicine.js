const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add medicine name'],
    unique: true
  },
  genericName: String,
  manufacturer: String,
  category: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler'],
    required: true
  },
  strength: String,
  prescriptionRequired: {
    type: Boolean,
    default: true
  },
  price: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  expiryDate: Date,
  image: String,
  description: String,
  sideEffects: [String],
  dosage: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Medicine', MedicineSchema);