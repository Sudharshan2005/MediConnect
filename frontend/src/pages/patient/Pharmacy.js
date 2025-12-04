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
  Alert,
  Pagination,
  Modal
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useCart } from '../../context/CartContext';

const Pharmacy = () => {
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [prescriptionUpload, setPrescriptionUpload] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const { addToCart } = useCart();

  const medicinesPerPage = 9;

  useEffect(() => {
    fetchMedicines();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterMedicines();
  }, [searchTerm, category, medicines]);

  const fetchMedicines = async () => {
    try {
      const res = await axios.get('/api/v1/medicines');
      setMedicines(res.data.data);
      setFilteredMedicines(res.data.data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/v1/medicines');
      const cats = [...new Set(res.data.data.map(med => med.category))];
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterMedicines = () => {
    let filtered = medicines;

    if (searchTerm) {
      filtered = filtered.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (category) {
      filtered = filtered.filter(medicine =>
        medicine.category === category
      );
    }

    setFilteredMedicines(filtered);
    setCurrentPage(1);
  };

  const handleAddToCart = (medicine) => {
    if (medicine.prescriptionRequired) {
      toast.warning('This medicine requires a prescription');
      return;
    }

    if (medicine.stock === 0) {
      toast.error('This medicine is out of stock');
      return;
    }

    addToCart({
      id: medicine._id,
      name: medicine.name,
      price: medicine.price,
      quantity: 1,
      image: medicine.image,
      prescriptionRequired: medicine.prescriptionRequired,
      maxQuantity: medicine.stock
    });

    toast.success('Added to cart');
  };

  const handlePrescriptionUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setPrescriptionFile(file);

    const formData = new FormData();
    formData.append('prescription', file);

    try {
      const res = await axios.post('/api/v1/prescriptions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Prescription uploaded successfully');
      setPrescriptionUpload(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    }
  };

  // Pagination
  const indexOfLastMedicine = currentPage * medicinesPerPage;
  const indexOfFirstMedicine = indexOfLastMedicine - medicinesPerPage;
  const currentMedicines = filteredMedicines.slice(indexOfFirstMedicine, indexOfLastMedicine);
  const totalPages = Math.ceil(filteredMedicines.length / medicinesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
          <h2>Online Pharmacy</h2>
          <p className="text-muted">Order medicines and healthcare products</p>
        </Col>
        <Col md="auto" className="d-flex align-items-center">
          <Button
            variant="outline-primary"
            className="me-2"
            onClick={() => setPrescriptionUpload(true)}
          >
            📄 Upload Prescription
          </Button>
          <Button as={Link} to="/patient/cart" variant="primary">
            🛒 View Cart
          </Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text>
              🔍
            </InputGroup.Text>
            <Form.Control
              placeholder="Search medicines by name, brand, or manufacturer"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Form.Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Row>
        {currentMedicines.length > 0 ? (
          currentMedicines.map((medicine) => (
            <Col key={medicine._id} md={4} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <div className="text-center mb-3">
                    <img
                      src={medicine.image || '/medicine-placeholder.png'}
                      alt={medicine.name}
                      style={{ height: '120px', objectFit: 'contain' }}
                    />
                  </div>
                  
                  <Card.Title className="mb-2">
                    {medicine.name}
                    {medicine.prescriptionRequired && (
                      <Badge bg="warning" className="ms-2">Rx</Badge>
                    )}
                  </Card.Title>
                  
                  <Card.Subtitle className="mb-2 text-muted">
                    {medicine.manufacturer}
                  </Card.Subtitle>
                  
                  <div className="mb-3">
                    <Badge bg="light" text="dark" className="me-1 mb-1">
                      {medicine.category}
                    </Badge>
                    <Badge bg="light" text="dark" className="me-1 mb-1">
                      {medicine.type}
                    </Badge>
                    <Badge bg="light" text="dark" className="mb-1">
                      {medicine.strength}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <p className="text-muted small mb-1">
                      {medicine.description?.substring(0, 100)}...
                    </p>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="text-primary mb-0">₹{medicine.price}</h5>
                      {medicine.discount > 0 && (
                        <small className="text-muted text-decoration-line-through">
                          ₹{medicine.price + (medicine.price * medicine.discount / 100)}
                        </small>
                      )}
                    </div>
                    
                    <div className="d-flex align-items-center">
                      {medicine.stock > 0 ? (
                        <>
                          <Badge bg={medicine.stock < 10 ? 'warning' : 'success'}>
                            {medicine.stock} in stock
                          </Badge>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="ms-2"
                            onClick={() => handleAddToCart(medicine)}
                          >
                            ➕
                          </Button>
                        </>
                      ) : (
                        <Badge bg="danger">Out of stock</Badge>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col>
            <Alert variant="info">
              No medicines found. Try adjusting your search criteria.
            </Alert>
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

      {/* Prescription Upload Modal */}
      <Modal show={prescriptionUpload} onHide={() => setPrescriptionUpload(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Prescription</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Upload prescription image</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handlePrescriptionUpload}
            />
            <Form.Text className="text-muted">
              Upload a clear image of your prescription. Max file size: 5MB
            </Form.Text>
          </Form.Group>
          
          <div className="mt-3">
            <h6>Instructions:</h6>
            <ul className="text-muted small">
              <li>Ensure prescription details are clearly visible</li>
              <li>Include doctor's signature and stamp</li>
              <li>Make sure date is visible</li>
              <li>Prescription should be valid and not expired</li>
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setPrescriptionUpload(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Pharmacy;