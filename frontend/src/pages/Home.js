import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, isPatient, isDoctor, isAdmin } = useAuth();

  const features = [
    {
      icon: '🔍',
      title: 'Find Doctors',
      description: 'Search and book appointments with verified doctors'
    },
    {
      icon: '🎥',
      title: 'Online Consultation',
      description: 'Video consultation from the comfort of your home'
    },
    {
      icon: '🛡️',
      title: 'Safe & Secure',
      description: 'Your medical data is encrypted and secure'
    },
    {
      icon: '🚚',
      title: 'Medicine Delivery',
      description: 'Get prescribed medicines delivered to your doorstep'
    }
  ];

  return (
    <Container fluid className="px-0">
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h1 className="display-4 fw-bold mb-3">
                Your Health, Our Priority
              </h1>
              <p className="lead mb-4">
                Book doctor appointments, consult online, and order medicines
                all in one place. Fast, reliable, and secure healthcare services.
              </p>
              <div className="d-flex gap-3">
                {!isAuthenticated ? (
                  <>
                    <Button as={Link} to="/register" variant="light" size="lg">
                      Get Started
                    </Button>
                    <Button as={Link} to="/login" variant="outline-light" size="lg">
                      Login
                    </Button>
                  </>
                ) : (
                  <>
                    {isPatient && (
                      <Button as={Link} to="/patient/dashboard" variant="light" size="lg">
                        Go to Dashboard
                      </Button>
                    )}
                    {isDoctor && (
                      <Button as={Link} to="/doctor/dashboard" variant="light" size="lg">
                        Doctor Dashboard
                      </Button>
                    )}
                    {isAdmin && (
                      <Button as={Link} to="/admin/dashboard" variant="light" size="lg">
                        Admin Dashboard
                      </Button>
                    )}
                  </>
                )}
              </div>
            </Col>
            <Col md={6}>
              <img
                src="/hero-image.svg"
                alt="Healthcare"
                className="img-fluid rounded"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80";
                }}
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5">
        <Row className="mb-5">
          <Col className="text-center">
            <h2>Why Choose MediConnect?</h2>
            <p className="text-muted">Comprehensive healthcare solutions at your fingertips</p>
          </Col>
        </Row>
        <Row>
          {features.map((feature, index) => (
            <Col key={index} md={3} className="mb-4">
              <Card className="h-100 text-center border-0 shadow-sm">
                <Card.Body>
                  <div className="display-4 mb-3">{feature.icon}</div>
                  <Card.Title>{feature.title}</Card.Title>
                  <Card.Text className="text-muted">
                    {feature.description}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Stats Section */}
      <div className="bg-light py-5">
        <Container>
          <Row className="text-center">
            <Col md={3}>
              <h3 className="display-4 fw-bold text-primary">500+</h3>
              <p className="text-muted">Verified Doctors</p>
            </Col>
            <Col md={3}>
              <h3 className="display-4 fw-bold text-primary">10K+</h3>
              <p className="text-muted">Happy Patients</p>
            </Col>
            <Col md={3}>
              <h3 className="display-4 fw-bold text-primary">5K+</h3>
              <p className="text-muted">Consultations</p>
            </Col>
            <Col md={3}>
              <h3 className="display-4 fw-bold text-primary">98%</h3>
              <p className="text-muted">Satisfaction Rate</p>
            </Col>
          </Row>
        </Container>
      </div>

      {/* CTA Section */}
      <Container className="py-5 text-center">
        <h2 className="mb-4">Ready to Take Control of Your Health?</h2>
        <p className="lead mb-4">
          Join thousands of patients who trust MediConnect for their healthcare needs.
        </p>
        <Button as={Link} to={isAuthenticated ? "/patient/doctors" : "/register"} variant="primary" size="lg">
          {isAuthenticated ? 'Book Appointment Now' : 'Get Started Free'}
        </Button>
      </Container>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <Container>
          <Row>
            <Col md={4}>
              <h5>MediConnect</h5>
              <p className="text-muted small">
                Your trusted healthcare partner for appointments, consultations, and pharmacy services.
              </p>
            </Col>
            <Col md={4}>
              <h5>Quick Links</h5>
              <ul className="list-unstyled">
                <li><Link to="/" className="text-muted text-decoration-none">Home</Link></li>
                <li><Link to="/patient/doctors" className="text-muted text-decoration-none">Find Doctors</Link></li>
                <li><Link to="/patient/pharmacy" className="text-muted text-decoration-none">Pharmacy</Link></li>
              </ul>
            </Col>
            <Col md={4}>
              <h5>Contact Us</h5>
              <p className="text-muted small mb-1">Email: support@mediconnect.com</p>
              <p className="text-muted small mb-1">Phone: +91 9876543210</p>
              <p className="text-muted small">24/7 Customer Support</p>
            </Col>
          </Row>
          <hr className="bg-secondary my-3" />
          <div className="text-center text-muted small">
            © 2024 MediConnect. All rights reserved.
          </div>
        </Container>
      </footer>
    </Container>
  );
};

export default Home;