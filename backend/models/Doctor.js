const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: [true, 'Please add specialization']
  },
  qualifications: [{
    degree: String,
    college: String,
    year: Number
  }],
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  experience: {
    type: Number,
    required: true
  },
  hospital: {
    type: String,
    required: true
  },
  consultationFee: {
    type: Number,
    required: true,
    default: 500
  },
  availableDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  availableSlots: [{
    day: String,
    slots: [{
      startTime: String,
      endTime: String,
      isAvailable: Boolean
    }]
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  reviews: [{
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    rating: Number,
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  consultationTypes: [{
    type: String,
    enum: ['in-person', 'video', 'chat'],
    default: ['in-person']
  }],
  languages: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Doctor', DoctorSchema);