import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Modal
} from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const res = await axios.get('/api/v1/prescriptions');
      setPrescriptions(res.data.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailsModal(true);
  };

  const handleOrderMedicines = (prescription) => {
    // Implement order functionality
    toast.info('Order functionality coming soon');
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      pending: 'warning',
      expired: 'danger',
      fulfilled: 'info'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>My Prescriptions</h2>
          <p className="text-muted">View and manage your prescriptions</p>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => window.open('/patient/pharmacy')}>
            Order Medicines
          </Button>
        </Col>
      </Row>

      <Row>
        {loading ? (
          <Col>
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </Col>
        ) : prescriptions.length > 0 ? (
          <Col>
            <Card>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Doctor</th>
                      <th>Diagnosis</th>
                      <th>Medicines</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((prescription) => (
                      <tr key={prescription._id}>
                        <td>{new Date(prescription.issuedDate).toLocaleDateString()}</td>
                        <td>{prescription.doctor?.user?.name}</td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: '200px' }}>
                            {prescription.diagnosis || 'No diagnosis'}
                          </div>
                        </td>
                        <td>{prescription.medicines?.length || 0}</td>
                        <td>{getStatusBadge(prescription.status)}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewDetails(prescription)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleOrderMedicines(prescription)}
                              disabled={prescription.status !== 'active'}
                            >
                              Order
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          <Col>
            <Card>
              <Card.Body className="text-center py-5">
                <h4>No prescriptions found</h4>
                <p className="text-muted">You don't have any prescriptions yet</p>
                <Button href="/patient/appointments" variant="primary">
                  Book Appointment
                </Button>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Prescription Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Prescription Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPrescription && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Doctor:</strong> {selectedPrescription.doctor?.user?.name}
                </Col>
                <Col md={6}>
                  <strong>Date:</strong> {new Date(selectedPrescription.issuedDate).toLocaleDateString()}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Specialization:</strong> {selectedPrescription.doctor?.specialization}
                </Col>
                <Col md={6}>
                  <strong>Status:</strong> {getStatusBadge(selectedPrescription.status)}
                </Col>
              </Row>
              
              {selectedPrescription.diagnosis && (
                <div className="mb-3">
                  <strong>Diagnosis:</strong>
                  <p>{selectedPrescription.diagnosis}</p>
                </div>
              )}

              {selectedPrescription.notes && (
                <div className="mb-3">
                  <strong>Notes:</strong>
                  <p>{selectedPrescription.notes}</p>
                </div>
              )}

              {selectedPrescription.medicines && selectedPrescription.medicines.length > 0 && (
                <div className="mb-3">
                  <strong>Medicines:</strong>
                  <Table responsive size="sm" className="mt-2">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPrescription.medicines.map((medicine, index) => (
                        <tr key={index}>
                          <td>{medicine.name}</td>
                          <td>{medicine.dosage}</td>
                          <td>{medicine.frequency}</td>
                          <td>{medicine.duration}</td>
                          <td>{medicine.instructions || 'As directed'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              {selectedPrescription.followUpDate && (
                <div className="mb-3">
                  <strong>Follow-up Date:</strong>
                  <p>{new Date(selectedPrescription.followUpDate).toLocaleDateString()}</p>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary"
            onClick={() => {
              setShowDetailsModal(false);
              handleOrderMedicines(selectedPrescription);
            }}
            disabled={selectedPrescription?.status !== 'active'}
          >
            Order Medicines
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Prescriptions;