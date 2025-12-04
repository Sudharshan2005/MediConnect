import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Modal,
  Badge
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [consultationType, setConsultationType] = useState('in-person');

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  const fetchDoctorDetails = async () => {
    try {
      const [doctorRes] = await Promise.all([
        axios.get(`/api/v1/doctors/${doctorId}`)
      ]);

      setDoctor(doctorRes.data.data);
      setAvailableSlots(doctorRes.data.data.availableSlots || []);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      toast.error('Failed to load doctor details');
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      symptoms: '',
      notes: ''
    },
    validationSchema: Yup.object({
      symptoms: Yup.string().required('Symptoms are required'),
      notes: Yup.string()
    }),
    onSubmit: (values) => {
      if (!selectedDate || !selectedSlot) {
        toast.error('Please select date and time slot');
        return;
      }
      setShowConfirmModal(true);
    }
  });

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const confirmBooking = async () => {
    try {
      const appointmentData = {
        doctor: doctorId,
        date: selectedDate,
        timeSlot: selectedSlot,
        consultationType,
        symptoms: formik.values.symptoms,
        notes: formik.values.notes
      };

      const res = await axios.post('/api/v1/appointments', appointmentData);
      
      toast.success('Appointment booked successfully!');
      navigate('/patient/appointments');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Booking failed');
    } finally {
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (!doctor) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">Doctor not found</Alert>
      </Container>
    );
  }

  const getAvailableDates = () => {
    const dates = [];
    availableSlots.forEach(day => {
      if (day.slots && day.slots.length > 0) {
        dates.push(day.date);
      }
    });
    return dates;
  };

  const getSlotsForDate = (date) => {
    const day = availableSlots.find(d => d.date === date);
    return day ? day.slots : [];
  };

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Book Appointment</Card.Title>
              <div className="d-flex align-items-start mb-4">
                <img
                  src={doctor.user?.profileImage || '/default-avatar.png'}
                  alt={doctor.user?.name}
                  className="rounded-circle me-3"
                  width={80}
                  height={80}
                />
                <div>
                  <h4 className="mb-1">{doctor.user?.name}</h4>
                  <p className="text-muted mb-1">{doctor.specialization}</p>
                  <div className="d-flex align-items-center">
                    <Badge bg="light" text="dark" className="me-2">
                      📍 {doctor.hospital}
                    </Badge>
                    <Badge bg="light" text="dark">
                      👨‍⚕️ {doctor.experience} years
                    </Badge>
                  </div>
                </div>
              </div>

              <Form onSubmit={formik.handleSubmit}>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Consultation Type</Form.Label>
                      <div>
                        <Form.Check
                          type="radio"
                          id="in-person"
                          label="In-person"
                          name="consultationType"
                          checked={consultationType === 'in-person'}
                          onChange={() => setConsultationType('in-person')}
                          inline
                          className="me-3"
                        />
                        <Form.Check
                          type="radio"
                          id="video"
                          label="Video"
                          name="consultationType"
                          checked={consultationType === 'video'}
                          onChange={() => setConsultationType('video')}
                          inline
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Consultation Fee</Form.Label>
                      <h4 className="text-primary">₹{doctor.consultationFee}</h4>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>
                    📅 Select Date
                  </Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {getAvailableDates().map((date) => (
                      <Button
                        key={date}
                        variant={selectedDate === date ? 'primary' : 'outline-primary'}
                        onClick={() => handleDateSelect(date)}
                        className="mb-2"
                      >
                        {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Button>
                    ))}
                  </div>
                </Form.Group>

                {selectedDate && (
                  <Form.Group className="mb-3">
                    <Form.Label>
                      ⏰ Select Time Slot
                    </Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {getSlotsForDate(selectedDate).map((slot, index) => (
                        <Button
                          key={index}
                          variant={selectedSlot === slot ? 'primary' : 'outline-primary'}
                          onClick={() => handleSlotSelect(slot)}
                          className="mb-2"
                        >
                          {slot.startTime} - {slot.endTime}
                        </Button>
                      ))}
                    </div>
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Symptoms</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="symptoms"
                    value={formik.values.symptoms}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    isInvalid={formik.touched.symptoms && formik.errors.symptoms}
                    placeholder="Describe your symptoms..."
                  />
                  <Form.Control.Feedback type="invalid">
                    {formik.errors.symptoms}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Additional Notes (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="notes"
                    value={formik.values.notes}
                    onChange={formik.handleChange}
                    placeholder="Any additional information..."
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={!selectedDate || !selectedSlot}
                >
                  Book Appointment
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Appointment Summary</h5>
            </Card.Header>
            <Card.Body>
              {selectedDate && selectedSlot ? (
                <>
                  <div className="mb-3">
                    <h6>Date & Time</h6>
                    <p className="mb-1">
                      {new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-muted mb-0">
                      {selectedSlot.startTime} - {selectedSlot.endTime}
                    </p>
                  </div>

                  <div className="mb-3">
                    <h6>Consultation Type</h6>
                    <p className="text-muted mb-0">{consultationType}</p>
                  </div>

                  <div className="mb-3">
                    <h6>Doctor</h6>
                    <p className="text-muted mb-0">{doctor.user?.name}</p>
                    <small className="text-muted">{doctor.specialization}</small>
                  </div>

                  <div className="mb-3">
                    <h6>Location</h6>
                    <p className="text-muted mb-0">{doctor.hospital}</p>
                  </div>

                  <hr />

                  <div className="d-flex justify-content-between">
                    <h6>Total Amount</h6>
                    <h5 className="text-primary">₹{doctor.consultationFee}</h5>
                  </div>
                </>
              ) : (
                <p className="text-muted">Select date and time to see summary</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Appointment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to book this appointment?</p>
          <div className="mb-3">
            <strong>Doctor:</strong> {doctor.user?.name}
          </div>
          <div className="mb-3">
            <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}
          </div>
          <div className="mb-3">
            <strong>Time:</strong> {selectedSlot?.startTime} - {selectedSlot?.endTime}
          </div>
          <div className="mb-3">
            <strong>Amount:</strong> ₹{doctor.consultationFee}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmBooking}>
            Confirm Booking
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BookAppointment;