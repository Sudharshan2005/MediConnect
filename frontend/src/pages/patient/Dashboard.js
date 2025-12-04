import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PatientDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalPrescriptions: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [appointmentsRes, prescriptionsRes] = await Promise.all([
        axios.get('/api/v1/appointments/upcoming'),
        axios.get('/api/v1/prescriptions')
      ]);

      const appointments = appointmentsRes.data.data;
      const prescriptions = prescriptionsRes.data.data;

      setStats({
        totalAppointments: appointments.length,
        upcomingAppointments: appointments.filter(a => a.status === 'confirmed').length,
        completedAppointments: appointments.filter(a => a.status === 'completed').length,
        totalPrescriptions: prescriptions.length
      });

      setUpcomingAppointments(appointments.slice(0, 5));
      setRecentPrescriptions(prescriptions.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Appointments',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Appointments',
      },
    },
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
        <Col md={8}>
          <h2>Welcome back, {user?.name}!</h2>
          <p className="text-muted">Here's what's happening with your health today.</p>
        </Col>
        <Col md={4} className="text-end">
          <Button as={Link} to="/patient/doctors" variant="primary" className="me-2">
            Book Appointment
          </Button>
          <Button as={Link} to="/patient/pharmacy" variant="outline-primary">
            Order Medicines
          </Button>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>{stats.totalAppointments}</Card.Title>
              <Card.Text>Total Appointments</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>{stats.upcomingAppointments}</Card.Title>
              <Card.Text>Upcoming Appointments</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>{stats.completedAppointments}</Card.Title>
              <Card.Text>Completed</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>{stats.totalPrescriptions}</Card.Title>
              <Card.Text>Prescriptions</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={8}>
          <Card>
            <Card.Body>
              <Card.Title>Monthly Activity</Card.Title>
              <Line data={chartData} options={chartOptions} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Title>Quick Actions</Card.Title>
              <div className="d-grid gap-2">
                <Button as={Link} to="/patient/doctors" variant="primary">
                  Find a Doctor
                </Button>
                <Button as={Link} to="/patient/appointments" variant="outline-primary">
                  View Appointments
                </Button>
                <Button as={Link} to="/patient/pharmacy" variant="outline-primary">
                  Order Medicines
                </Button>
                <Button as={Link} to="/patient/prescriptions" variant="outline-primary">
                  View Prescriptions
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Upcoming Appointments</Card.Title>
              {upcomingAppointments.length > 0 ? (
                <Table hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Doctor</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAppointments.map((appointment) => (
                      <tr key={appointment._id}>
                        <td>{new Date(appointment.date).toLocaleDateString()}</td>
                        <td>{appointment.doctor?.user?.name}</td>
                        <td>{appointment.timeSlot?.startTime}</td>
                        <td>
                          <Badge bg={
                            appointment.status === 'confirmed' ? 'success' :
                            appointment.status === 'pending' ? 'warning' : 'secondary'
                          }>
                            {appointment.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No upcoming appointments</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Recent Prescriptions</Card.Title>
              {recentPrescriptions.length > 0 ? (
                <Table hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Doctor</th>
                      <th>Medicines</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPrescriptions.map((prescription) => (
                      <tr key={prescription._id}>
                        <td>{new Date(prescription.issuedDate).toLocaleDateString()}</td>
                        <td>{prescription.doctor?.user?.name}</td>
                        <td>{prescription.medicines?.length}</td>
                        <td>
                          <Badge bg={
                            prescription.status === 'active' ? 'success' :
                            prescription.status === 'pending' ? 'warning' : 'secondary'
                          }>
                            {prescription.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No prescriptions</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PatientDashboard;