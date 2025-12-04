import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Alert,
  Badge
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, itemCount, removeFromCart, updateQuantity, clearCart } = useCart();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const shippingCharge = cartTotal > 500 ? 0 : 50;
  const tax = cartTotal * 0.18; // 18% GST
  const finalTotal = cartTotal + shippingCharge + tax - discount;

  const handleQuantityChange = (productId, newQuantity) => {
    updateQuantity(productId, parseInt(newQuantity));
  };

  const handleApplyCoupon = () => {
    // Mock coupon validation
    if (coupon === 'MEDICONNECT10') {
      setDiscount(cartTotal * 0.1); // 10% discount
      alert('Coupon applied successfully!');
    } else {
      alert('Invalid coupon code');
    }
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }
    navigate('/patient/checkout');
  };

  if (cart.length === 0) {
    return (
      <Container className="mt-5">
        <Card>
          <Card.Body className="text-center py-5">
            <div className="display-4 mb-3">🛒</div>
            <h4>Your cart is empty</h4>
            <p className="text-muted">Add items to your cart to proceed</p>
            <Button as={Link} to="/patient/pharmacy" variant="primary">
              Continue Shopping
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Shopping Cart ({itemCount} items)</h5>
              <Button variant="outline-danger" size="sm" onClick={clearCart}>
                Clear Cart
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={item.image || '/medicine-placeholder.png'}
                            alt={item.name}
                            style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                            className="me-3"
                          />
                          <div>
                            <h6 className="mb-1">{item.name}</h6>
                            {item.prescriptionRequired && (
                              <Badge bg="warning" className="me-1">Rx Required</Badge>
                            )}
                            {item.maxQuantity && item.quantity > item.maxQuantity && (
                              <Badge bg="danger" className="me-1">
                                Max: {item.maxQuantity}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>₹{item.price}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <Form.Control
                            type="number"
                            min="1"
                            max={item.maxQuantity || 100}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            style={{ width: '70px', textAlign: 'center' }}
                            className="mx-2"
                          />
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={item.quantity >= (item.maxQuantity || 100)}
                          >
                            +
                          </Button>
                        </div>
                      </td>
                      <td>₹{item.price * item.quantity}</td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                        >
                          🗑️
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between mb-4">
            <Button as={Link} to="/patient/pharmacy" variant="outline-primary">
              ← Continue Shopping
            </Button>
          </div>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <Form.Group>
                  <Form.Label>Coupon Code</Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      placeholder="Enter coupon code"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="me-2"
                    />
                    <Button variant="outline-secondary" onClick={handleApplyCoupon}>
                      Apply
                    </Button>
                  </div>
                </Form.Group>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Shipping</span>
                  <span>{shippingCharge === 0 ? 'Free' : `₹${shippingCharge}`}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Tax (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <h6>Total</h6>
                  <h5 className="text-primary">₹{finalTotal.toFixed(2)}</h5>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-100 mb-3"
                onClick={handleProceedToCheckout}
              >
                Proceed to Checkout
              </Button>

              <Alert variant="info" className="small">
                <strong>Free Shipping</strong> on orders above ₹500
              </Alert>

              <div className="small text-muted">
                <p className="mb-1">✅ Prescription verification included</p>
                <p className="mb-1">✅ 100% genuine medicines</p>
                <p className="mb-1">✅ Secure payment</p>
                <p className="mb-0">✅ Free doctor consultation on orders above ₹1000</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;