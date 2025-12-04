import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const NavigationBar = () => {
  const { isAuthenticated, user, logout, isPatient, isDoctor, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">MediConnect</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            
            {isAuthenticated && isPatient && (
              <>
                <Nav.Link as={Link} to="/patient/dashboard">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/patient/doctors">Find Doctors</Nav.Link>
                <Nav.Link as={Link} to="/patient/appointments">Appointments</Nav.Link>
                <Nav.Link as={Link} to="/patient/prescriptions">Prescriptions</Nav.Link>
                <Nav.Link as={Link} to="/patient/pharmacy">Pharmacy</Nav.Link>
              </>
            )}
            
            {isAuthenticated && isDoctor && (
              <>
                <Nav.Link as={Link} to="/doctor/dashboard">Dashboard</Nav.Link>
              </>
            )}
            
            {isAuthenticated && isAdmin && (
              <>
                <Nav.Link as={Link} to="/admin/dashboard">Dashboard</Nav.Link>
              </>
            )}
          </Nav>
          
          <Nav>
            {isAuthenticated ? (
              <NavDropdown title={`Welcome, ${user?.name}`} id="user-dropdown">
                <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Button as={Link} to="/register" variant="outline-light">Register</Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;