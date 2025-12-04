const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
const auth = require('./routes/auth');
const users = require('./routes/users');  // Add this line
const doctors = require('./routes/doctors');
const appointments = require('./routes/appointments');
const prescriptions = require('./routes/prescriptions');
const medicines = require('./routes/medicines');
const orders = require('./routes/orders');
const admin = require('./routes/admin');
const payments = require('./routes/payments');

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);  // Add this line
app.use('/api/v1/doctors', doctors);
app.use('/api/v1/appointments', appointments);
app.use('/api/v1/prescriptions', prescriptions);
app.use('/api/v1/medicines', medicines);
app.use('/api/v1/orders', orders);
app.use('/api/v1/admin', admin);
app.use('/api/v1/payments', payments);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});