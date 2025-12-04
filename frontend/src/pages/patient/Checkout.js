import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Tab,
  Tabs,
  Spinner
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });
  const [paymentMethod, setPaymentMethod] = useState('online');

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/patient/cart');
    }
  }, [cart, navigate]);

  const calculateTotals = () => {
    const shippingCharge = cartTotal > 500 ? 0 : 50;
    const tax = cartTotal * 0.18;
    const finalTotal = cartTotal + shippingCharge + tax;
    return { shippingCharge, tax, finalTotal };
  };

  const { shippingCharge, tax, finalTotal } = calculateTotals();

  const handleAddressChange = (e) => {
    setAddress({
      ...address,
      [e.target.name]: e.target.value
    });
  };

  const validateAddress = () => {
    const requiredFields = ['name', 'phone', 'addressLine1', 'city', 'state', 'zipCode'];
    for (const field of requiredFields) {
      if (!address[field]) {
        toast.error(`Please fill ${field}`);
        return false;
      }
    }
    return true;
  };

  const createOrder = async () => {
    try {
      setLoading(true);

      const orderData = {
        patient: user.id,
        items: cart.map(item => ({
          medicine: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        shippingAddress: address,
        totalAmount: cartTotal,
        shippingCharge,
        tax,
        finalAmount: finalTotal,
        paymentMethod,
        orderStatus: 'pending'
      };

      const res = await axios.post('/api/v1/orders', orderData);
      setOrder(res.data.data);
      return res.data.data;
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!validateAddress()) return;

    const orderData = await createOrder();
    if (!orderData) return;

    if (paymentMethod === 'cod') {
      handleCODOrder(orderData);
      return;
    }

    // Online payment using Razorpay
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error('Failed to load payment gateway');
      return;
    }

    try {
      // Create Razorpay order
      const paymentRes = await axios.post('/api/v1/payments/create-order', {
        amount: finalTotal,
        receipt: orderData.orderId
      });

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: paymentRes.data.data.amount,
        currency: 'INR',
        name: 'MediConnect Pharmacy',
        description: 'Medicine Order',
        order_id: paymentRes.data.data.orderId,
        handler: async (response) => {
          await verifyPayment(response, orderData._id);
        },
        prefill: {
          name: address.name,
          email: user.email,
          contact: address.phone
        },
        theme: {
          color: '#007bff'
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment initialization failed');
    }
  };

  const verifyPayment = async (paymentResponse, orderId) => {
    try {
      await axios.post('/api/v1/payments/verify', {
        orderId: paymentResponse.razorpay_order_id,
        paymentId: paymentResponse.razorpay_payment_id,
        signature: paymentResponse.razorpay_signature,
        amount: finalTotal,
        orderDbId: orderId
      });

      toast.success('Payment successful! Order placed.');
      clearCart();
      navigate('/patient/orders');
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Payment verification failed');
    }
  };

  const handleCODOrder = async (orderData) => {
    try {
      // Update order status for COD
      await axios.put(`/api/v1/orders/${orderData._id}`, {
        paymentStatus: 'pending',
        orderStatus: 'processing'
      });

      toast.success('Order placed successfully! Pay on delivery.');
      clearCart();
      navigate('/patient/orders');
    } catch (error) {
      console.error('COD order error:', error);
      toast.error('Failed to place COD order');
    }
  };

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Shipping Address</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={address.name}
                        onChange={handleAddressChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Phone Number *</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={address.phone}
                        onChange={handleAddressChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Address Line 1 *</Form.Label>
                  <Form.Control
                    type="text"
                    name="addressLine1"
                    value={address.addressLine1}
                    onChange={handleAddressChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Address Line 2 (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="addressLine2"
                    value={address.addressLine2}
                    onChange={handleAddressChange}
                  />
                </Form.Group>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>City *</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={address.city}
                        onChange={handleAddressChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>State *</Form.Label>
                      <Form.Control
                        type="text"
                        name="state"
                        value={address.state}
                        onChange={handleAddressChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>ZIP Code *</Form.Label>
                      <Form.Control
                        type="text"
                        name="zipCode"
                        value={address.zipCode}
                        onChange={handleAddressChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Country</Form.Label>
                      <Form.Control
                        type="text"
                        name="country"
                        value={address.country}
                        onChange={handleAddressChange}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Payment Method</h5>
            </Card.Header>
            <Card.Body>
              <Tabs
                activeKey={paymentMethod}
                onSelect={(k) => setPaymentMethod(k)}
                className="mb-3"
              >
                <Tab eventKey="online" title="Online Payment">
                  <Alert variant="info" className="mt-3">
                    <strong>Secure Payment</strong> - Your payment is encrypted and secure
                  </Alert>
                  <div className="d-flex justify-content-between mt-3">
                    <div>
                      <img src="/razorpay-logo.png" alt="Razorpay" height="40" className="me-3" />
                      <img src="/stripe-logo.png" alt="Stripe" height="40" />
                    </div>
                  </div>
                </Tab>
                <Tab eventKey="cod" title="Cash on Delivery">
                  <Alert variant="warning" className="mt-3">
                    <strong>Note:</strong> A delivery charge of ₹50 may apply for COD orders
                  </Alert>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <h6>Items ({cart.length})</h6>
                {cart.map((item) => (
                  <div key={item.id} className="d-flex justify-content-between mb-2">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <hr />

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Shipping</span>
                  <span>
                    {shippingCharge === 0 ? 'Free' : `₹${shippingCharge}`}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Tax (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <h6>Total Amount</h6>
                  <h5 className="text-primary">₹{finalTotal.toFixed(2)}</h5>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-100"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Processing...
                  </>
                ) : (
                  `Pay ₹${finalTotal.toFixed(2)}`
                )}
              </Button>

              <Alert variant="light" className="mt-3 small">
                <p className="mb-1">
                  By completing your purchase, you agree to our Terms of Service
                </p>
                <p className="mb-0">
                  Your personal data will be used to process your order and support
                  your experience throughout this website.
                </p>
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Checkout;