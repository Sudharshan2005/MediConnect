const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Medicine = require('./models/Medicine');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mediconnect');
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await Medicine.deleteMany({});

    // Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      phone: '9876543210',
      isVerified: true
    });
    console.log('Admin created:', admin.email);

    // Create Patient
    const patientUser = await User.create({
      name: 'John Doe',
      email: 'patient@example.com',
      password: 'password123',
      role: 'patient',
      phone: '9876543211',
      isVerified: true
    });

    const patient = await Patient.create({
      user: patientUser._id,
      bloodGroup: 'O+',
      height: 175,
      weight: 70,
      allergies: ['Penicillin']
    });
    console.log('Patient created:', patientUser.email);

    // Create Doctor
    const doctorUser = await User.create({
      name: 'Dr. Sarah Smith',
      email: 'doctor@example.com',
      password: 'password123',
      role: 'doctor',
      phone: '9876543212',
      isVerified: true
    });

    const doctor = await Doctor.create({
      user: doctorUser._id,
      specialization: 'Cardiologist',
      licenseNumber: 'MD12345',
      experience: 10,
      hospital: 'City General Hospital',
      consultationFee: 800,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      availableSlots: [
        {
          day: 'monday',
          slots: [
            { startTime: '09:00', endTime: '10:00', isAvailable: true },
            { startTime: '10:00', endTime: '11:00', isAvailable: true },
            { startTime: '11:00', endTime: '12:00', isAvailable: true }
          ]
        }
      ],
      isVerified: true,
      consultationTypes: ['in-person', 'video']
    });
    console.log('Doctor created:', doctorUser.email);

    // Create Medicines
    const medicines = [
      {
        name: 'Paracetamol',
        genericName: 'Acetaminophen',
        manufacturer: 'Cipla',
        category: 'Pain Relief',
        type: 'tablet',
        strength: '500mg',
        prescriptionRequired: false,
        price: 10,
        stock: 100,
        description: 'Used for pain relief and fever'
      },
      {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        manufacturer: 'Sun Pharma',
        category: 'Antibiotic',
        type: 'capsule',
        strength: '500mg',
        prescriptionRequired: true,
        price: 45,
        stock: 50,
        description: 'Antibiotic for bacterial infections'
      },
      {
        name: 'Cetirizine',
        genericName: 'Cetirizine Hydrochloride',
        manufacturer: 'GSK',
        category: 'Allergy',
        type: 'tablet',
        strength: '10mg',
        prescriptionRequired: false,
        price: 15,
        stock: 80,
        description: 'For allergy relief'
      }
    ];

    await Medicine.insertMany(medicines);
    console.log('Medicines created');

    console.log('\n============================');
    console.log('Database seeded successfully!');
    console.log('============================');
    console.log('Admin Credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: password123');
    console.log('\nPatient Credentials:');
    console.log('Email: patient@example.com');
    console.log('Password: password123');
    console.log('\nDoctor Credentials:');
    console.log('Email: doctor@example.com');
    console.log('Password: password123');
    console.log('============================');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

connectDB().then(() => {
  seedUsers();
});