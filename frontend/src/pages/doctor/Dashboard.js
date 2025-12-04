import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  ProgressBar
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    monthlyAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    monthlyRevenue: 0,
    rating: 0,
    totalRatings: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, appointmentsRes] = await Promise.all([
        axios.get('/api/v1/doctors/dashboard/stats'),
        axios.get('/api/v1/appointments/upcoming')
      ]);

      setStats(statsRes.data.data);
      setUpcomingAppointments(appointmentsRes.data.data);
      
      // Get recent patients from appointments
      const patients = appointmentsRes.data.data.map(apt => apt.patient);
      setRecentPatients(patients.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'primary',
      completed: 'success',
      cancelled: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-warning' : 'text-muted'}>
          ★
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col>
          <h2>Doctor Dashboard</h2>
          <p className="text-muted">Manage your practice and appointments</p>
        </Col>
        <Col className="text-end">
          <Button variant="primary" className="me-2">Update Schedule</Button>
          <Button variant="outline-primary">View Profile</Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-6">{stats.totalAppointments}</Card.Title>
              <Card.Text>Total Appointments</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-6">{stats.upcomingAppointments}</Card.Title>
              <Card.Text>Upcoming</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-6">{stats.completedAppointments}</Card.Title>
              <Card.Text>Completed</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-6">₹{stats.monthlyRevenue}</Card.Title>
              <Card.Text>Monthly Revenue</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Upcoming Appointments</h5>
            </Card.Header>
            <Card.Body>
              {upcomingAppointments.length > 0 ? (
                <Table hover>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Patient</th>
                      <th>Type</th>
                      <th>Symptoms</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAppointments.map((appointment) => (
                      <tr key={appointment._id}>
                        <td>
                          <div>{new Date(appointment.date).toLocaleDateString()}</div>
                          <small className="text-muted">
                            {appointment.timeSlot?.startTime}
                          </small>
                        </td>
                        <td>{appointment.patient?.user?.name}</td>
                        <td>
                          <Badge bg={appointment.consultationType === 'video' ? 'primary' : 'info'}>
                            {appointment.consultationType}
                          </Badge>
                        </td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: '150px' }}>
                            {appointment.symptoms || 'No symptoms'}
                          </div>
                        </td>
                        <td>{getStatusBadge(appointment.status)}</td>
                        <td>
                          <Button size="sm" variant="outline-primary">
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-3">
                  <p className="text-muted">No upcoming appointments</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Rating & Reviews</h5>
            </Card.Header>
            <Card.Body className="text-center">
              <div className="mb-3">
                <h1 className="display-4">{stats.rating.toFixed(1)}</h1>
                <div className="mb-2">{renderStars(stats.rating)}</div>
                <small className="text-muted">Based on {stats.totalRatings} reviews</small>
              </div>
              <ProgressBar now={stats.rating * 20} className="mb-2" label={`${(stats.rating * 20).toFixed(0)}%`} />
              <Button variant="outline-primary" size="sm">
                View All Reviews
              </Button>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" className="mb-2">
                  Update Availability
                </Button>
                <Button variant="outline-primary" className="mb-2">
                  Write Prescription
                </Button>
                <Button variant="outline-primary" className="mb-2">
                  View Patient Records
                </Button>
                <Button variant="outline-primary">
                  Generate Report
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Recent Patients</h5>
            </Card.Header>
            <Card.Body>
              {recentPatients.length > 0 ? (
                <Table hover>
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Last Visit</th>
                      <th>Medical History</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPatients.map((patient, index) => (
                      <tr key={index}>
                        <td>{patient?.user?.name || 'Unknown'}</td>
                        <td>{patient?.lastVisit || 'N/A'}</td>
                        <td>
                          <Badge bg="info">View History</Badge>
                        </td>
                        <td>
                          <Badge bg="success">Active</Badge>
                        </td>
                        <td>
                          <Button size="sm" variant="outline-primary">
                            View Profile
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-3">
                  <p className="text-muted">No recent patients</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DoctorDashboard;