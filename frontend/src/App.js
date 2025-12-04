import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PatientDashboard from './pages/patient/Dashboard';
import DoctorDashboard from './pages/doctor/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import DoctorList from './pages/patient/DoctorList';
import BookAppointment from './pages/patient/BookAppointment';
import Appointments from './pages/patient/Appointments';
import Prescriptions from './pages/patient/Prescriptions';
import Pharmacy from './pages/patient/Pharmacy';
import Cart from './pages/patient/Cart';
import Checkout from './pages/patient/Checkout';
import VideoConsultation from './pages/VideoConsultation';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Patient Routes */}
            <Route path="/patient/dashboard" element={
              <PrivateRoute roles={['patient']}>
                <PatientDashboard />
              </PrivateRoute>
            } />
            <Route path="/patient/doctors" element={
              <PrivateRoute roles={['patient']}>
                <DoctorList />
              </PrivateRoute>
            } />
            <Route path="/patient/book-appointment/:doctorId" element={
              <PrivateRoute roles={['patient']}>
                <BookAppointment />
              </PrivateRoute>
            } />
            <Route path="/patient/appointments" element={
              <PrivateRoute roles={['patient']}>
                <Appointments />
              </PrivateRoute>
            } />
            <Route path="/patient/prescriptions" element={
              <PrivateRoute roles={['patient']}>
                <Prescriptions />
              </PrivateRoute>
            } />
            <Route path="/patient/pharmacy" element={
              <PrivateRoute roles={['patient']}>
                <Pharmacy />
              </PrivateRoute>
            } />
            <Route path="/patient/cart" element={
              <PrivateRoute roles={['patient']}>
                <Cart />
              </PrivateRoute>
            } />
            <Route path="/patient/checkout" element={
              <PrivateRoute roles={['patient']}>
                <Checkout />
              </PrivateRoute>
            } />
            
            {/* Doctor Routes */}
            <Route path="/doctor/dashboard" element={
              <PrivateRoute roles={['doctor']}>
                <DoctorDashboard />
              </PrivateRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <PrivateRoute roles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } />
            
            {/* Video Consultation */}
            <Route path="/video/:meetingId" element={
              <PrivateRoute>
                <VideoConsultation />
              </PrivateRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;