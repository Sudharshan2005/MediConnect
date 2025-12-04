import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Dropdown,
  Modal,
  Form
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get('/api/v1/appointments');
      setAppointments(res.data.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCancelAppointment = async () => {
    try {
      await axios.put(`/api/v1/appointments/${selectedAppointment._id}/status`, {
        status: 'cancelled'
      });
      
      toast.success('Appointment cancelled successfully');
      setShowCancelModal(false);
      setCancelReason('');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel appointment');
    }
  };

  const handleJoinVideo = (meetingLink) => {
    if (meetingLink) {
      window.open(meetingLink, '_blank');
    } else {
      toast.error('No meeting link available');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'primary',
      completed: 'success',
      cancelled: 'danger',
      'no-show': 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getConsultationTypeBadge = (type) => {
    const variants = {
      'in-person': 'info',
      'video': 'primary',
      'chat': 'success'
    };
    return <Badge bg={variants[type] || 'secondary'}>{type}</Badge>;
  };

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>My Appointments</h2>
          <p className="text-muted">View and manage your appointments</p>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : appointments.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Doctor</th>
                  <th>Type</th>
                  <th>Symptoms</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment._id}>
                    <td>
                      <div>{new Date(appointment.date).toLocaleDateString()}</div>
                      <small className="text-muted">
                        {appointment.timeSlot?.startTime} - {appointment.timeSlot?.endTime}
                      </small>
                    </td>
                    <td>{appointment.doctor?.user?.name}</td>
                    <td>{getConsultationTypeBadge(appointment.consultationType)}</td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '200px' }}>
                        {appointment.symptoms || 'No symptoms noted'}
                      </div>
                    </td>
                    <td>{getStatusBadge(appointment.status)}</td>
                    <td>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-primary" size="sm">
                          Actions
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item 
                            onClick={() => handleJoinVideo(appointment.meetingLink)}
                            disabled={!appointment.meetingLink || appointment.status !== 'confirmed'}
                          >
                            Join Video Call
                          </Dropdown.Item>
                          <Dropdown.Item href={`/appointments/${appointment._id}`}>
                            View Details
                          </Dropdown.Item>
                          <Dropdown.Item 
                            onClick={() => handleCancelClick(appointment)}
                            disabled={!['pending', 'confirmed'].includes(appointment.status)}
                          >
                            Cancel Appointment
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <h4>No appointments found</h4>
              <p className="text-muted">You haven't booked any appointments yet</p>
              <Button href="/patient/doctors" variant="primary">
                Book Appointment
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Cancel Appointment Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cancel Appointment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to cancel this appointment?</p>
          {selectedAppointment && (
            <div className="mb-3">
              <strong>Doctor:</strong> {selectedAppointment.doctor?.user?.name}<br />
              <strong>Date:</strong> {new Date(selectedAppointment.date).toLocaleDateString()}<br />
              <strong>Time:</strong> {selectedAppointment.timeSlot?.startTime}
            </div>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Reason for cancellation (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason for cancellation..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Close
          </Button>
          <Button variant="danger" onClick={handleCancelAppointment}>
            Confirm Cancellation
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Appointments;