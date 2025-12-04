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
  Spinner
} from 'react-bootstrap';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data
      const [
        usersRes,
        doctorsRes,
        appointmentsRes,
        ordersRes
      ] = await Promise.all([
        axios.get('/api/v1/users'),
        axios.get('/api/v1/doctors'),
        axios.get('/api/v1/appointments'),
        axios.get('/api/v1/orders')
      ]);

      const users = usersRes.data.data || [];
      const doctors = doctorsRes.data.data || [];
      const appointments = appointmentsRes.data.data || [];
      const orders = ordersRes.data.data || [];

      // Calculate stats
      setStats({
        totalUsers: users.length,
        totalDoctors: doctors.length,
        totalPatients: users.filter(u => u.role === 'patient').length,
        totalAppointments: appointments.length,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.finalAmount, 0)
      });

      // Set recent data
      setRecentUsers(users.slice(-5).reverse());
      setRecentAppointments(appointments.slice(-5).reverse());
      setRecentOrders(orders.slice(-5).reverse());

      // Prepare chart data
      prepareChartData(appointments, orders);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (appointments, orders) => {
    // Monthly appointments
    const monthlyAppointments = {};
    appointments.forEach(apt => {
      const month = new Date(apt.date).toLocaleString('default', { month: 'short' });
      monthlyAppointments[month] = (monthlyAppointments[month] || 0) + 1;
    });

    // Monthly revenue
    const monthlyRevenue = {};
    orders.forEach(order => {
      const month = new Date(order.createdAt).toLocaleString('default', { month: 'short' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + order.finalAmount;
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(month => ({
      month,
      appointments: monthlyAppointments[month] || 0,
      revenue: monthlyRevenue[month] || 0
    }));

    setChartData(data.slice(-6)); // Last 6 months
  };

  const userRoleData = [
    { name: 'Patients', value: stats.totalPatients },
    { name: 'Doctors', value: stats.totalDoctors },
    { name: 'Pharmacists', value: 5 },
    { name: 'Admins', value: 1 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>Admin Dashboard</h2>
          <p className="text-muted">System overview and analytics</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-6">{stats.totalUsers}</Card.Title>
              <Card.Text>Total Users</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-6">{stats.totalDoctors}</Card.Title>
              <Card.Text>Doctors</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-6">{stats.totalPatients}</Card.Title>
              <Card.Text>Patients</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-6">{stats.totalAppointments}</Card.Title>
              <Card.Text>Appointments</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-6">{stats.totalOrders}</Card.Title>
              <Card.Text>Orders</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-6">₹{stats.totalRevenue.toLocaleString()}</Card.Title>
              <Card.Text>Total Revenue</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Monthly Analytics</h5>
            </Card.Header>
            <Card.Body>
              <LineChart width={700} height={300} data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="appointments" stroke="#8884d8" />
                <Line type="monotone" dataKey="revenue" stroke="#82ca9d" />
              </LineChart>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">User Distribution</h5>
            </Card.Header>
            <Card.Body>
              <PieChart width={300} height={300}>
                <Pie
                  data={userRoleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userRoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={4}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Users</h5>
              <Button variant="link" size="sm">View All</Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>
                        <Badge bg={
                          user.role === 'admin' ? 'danger' :
                          user.role === 'doctor' ? 'primary' :
                          user.role === 'patient' ? 'success' : 'secondary'
                        }>
                          {user.role}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={user.isActive ? 'success' : 'secondary'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Appointments</h5>
              <Button variant="link" size="sm">View All</Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((apt) => (
                    <tr key={apt._id}>
                      <td>{apt.patient?.user?.name || 'Unknown'}</td>
                      <td>{new Date(apt.date).toLocaleDateString()}</td>
                      <td>
                        <Badge bg={
                          apt.status === 'completed' ? 'success' :
                          apt.status === 'confirmed' ? 'primary' :
                          apt.status === 'pending' ? 'warning' : 'secondary'
                        }>
                          {apt.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Orders</h5>
              <Button variant="link" size="sm">View All</Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td>{order.orderId}</td>
                      <td>₹{order.finalAmount}</td>
                      <td>
                        <Badge bg={
                          order.orderStatus === 'delivered' ? 'success' :
                          order.orderStatus === 'processing' ? 'primary' :
                          order.orderStatus === 'pending' ? 'warning' : 'secondary'
                        }>
                          {order.orderStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;