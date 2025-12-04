import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import jwt_decode from 'jwt-decode';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set axios default headers
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Load user from token
  useEffect(() => {
    const loadUser = async () => {
      if (token && !isTokenExpired(token)) {
        try {
          const res = await axios.get(`${API_URL}/auth/me`);
          setUser(res.data.data.user);
          setToken(token);
        } catch (error) {
          console.error('Error loading user:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (userData) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, userData);
      const { token, user } = res.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setToken(token);
      
      toast.success('Registration successful!');
      return { success: true, data: res.data };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      return { success: false, error: error.response?.data?.error };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user } = res.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setToken(token);
      
      toast.success('Login successful!');
      return { success: true, data: res.data };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      return { success: false, error: error.response?.data?.error };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
    toast.success('Logged out successfully');
  };

  // Update user details
  const updateUser = async (userData) => {
    try {
      const res = await axios.put(`${API_URL}/auth/updatedetails`, userData);
      setUser(res.data.data);
      toast.success('Profile updated successfully');
      return { success: true, data: res.data };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Update failed');
      return { success: false, error: error.response?.data?.error };
    }
  };

  // Update password
  const updatePassword = async (passwordData) => {
    try {
      const res = await axios.put(`${API_URL}/auth/updatepassword`, passwordData);
      toast.success('Password updated successfully');
      return { success: true, data: res.data };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Password update failed');
      return { success: false, error: error.response?.data?.error };
    }
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    updateUser,
    updatePassword,
    isAuthenticated: !!user,
    isPatient: user?.role === 'patient',
    isDoctor: user?.role === 'doctor',
    isAdmin: user?.role === 'admin',
    isPharmacist: user?.role === 'pharmacist'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};