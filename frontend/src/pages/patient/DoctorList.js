import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  InputGroup,
  Button,
  Badge,
  Spinner,
  Pagination
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [specializations, setSpecializations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [doctorsPerPage] = useState(6);

  useEffect(() => {
    fetchDoctors();
    fetchSpecializations();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchTerm, specialization, doctors]);

  const fetchDoctors = async () => {
    try {
      const res = await axios.get('/api/v1/doctors');
      setDoctors(res.data.data);
      setFilteredDoctors(res.data.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const res = await axios.get('/api/v1/doctors');
      const specs = [...new Set(res.data.data.map(doc => doc.specialization))];
      setSpecializations(specs);
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.hospital?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (specialization) {
      filtered = filtered.filter(doctor =>
        doctor.specialization === specialization
      );
    }

    setFilteredDoctors(filtered);
    setCurrentPage(1);
  };

  // Pagination
  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
  const currentDoctors = filteredDoctors.slice(indexOfFirstDoctor, indexOfLastDoctor);
  const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={i <= rating ? 'text-warning' : 'text-muted'}
        >
          ★
        </span>
      );
    }
    return stars;
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

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>Find Doctors</h2>
          <p className="text-muted">Book appointments with top doctors</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              🔍
            </InputGroup.Text>
            <Form.Control
              placeholder="Search doctors by name, specialization, or hospital"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={6}>
          <Form.Select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
          >
            <option value="">All Specializations</option>
            {specializations.map((spec, index) => (
              <option key={index} value={spec}>{spec}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Row>
        {currentDoctors.length > 0 ? (
          currentDoctors.map((doctor) => (
            <Col key={doctor._id} md={4} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex align-items-start mb-3">
                    <img
                      src={doctor.user?.profileImage || '/default-avatar.png'}
                      alt={doctor.user?.name}
                      className="rounded-circle me-3"
                      width={60}
                      height={60}
                    />
                    <div>
                      <Card.Title className="mb-1">
                        <Link to={`/patient/book-appointment/${doctor._id}`}>
                          {doctor.user?.name}
                        </Link>
                      </Card.Title>
                      <Card.Subtitle className="text-muted mb-2">
                        {doctor.specialization}
                      </Card.Subtitle>
                      <div className="d-flex align-items-center">
                        {renderStars(doctor.rating)}
                        <span className="ms-2">({doctor.totalRatings})</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <span className="me-2 text-muted">📍</span>
                      <span className="text-muted">{doctor.hospital}</span>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <span className="me-2 text-muted">⏰</span>
                      <span className="text-muted">{doctor.experience} years experience</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <Badge bg="light" text="dark" className="me-1 mb-1">
                      {doctor.consultationTypes?.join(', ')}
                    </Badge>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">₹{doctor.consultationFee}</h5>
                      <small className="text-muted">Consultation fee</small>
                    </div>
                    <Button
                      as={Link}
                      to={`/patient/book-appointment/${doctor._id}`}
                      variant="primary"
                      size="sm"
                    >
                      Book Now
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col>
            <Card>
              <Card.Body className="text-center py-5">
                <h4>No doctors found</h4>
                <p className="text-muted">Try adjusting your search criteria</p>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {totalPages > 1 && (
        <Row className="mt-4">
          <Col>
            <Pagination className="justify-content-center">
              <Pagination.Prev
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              />
              {[...Array(totalPages)].map((_, index) => (
                <Pagination.Item
                  key={index + 1}
                  active={index + 1 === currentPage}
                  onClick={() => paginate(index + 1)}
                >
                  {index + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default DoctorList;