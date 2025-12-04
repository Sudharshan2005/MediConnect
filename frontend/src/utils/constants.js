export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
  PHARMACIST: 'pharmacist'
};

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  DISPATCHED: 'dispatched',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const CONSULTATION_TYPES = {
  IN_PERSON: 'in-person',
  VIDEO: 'video',
  CHAT: 'chat'
};