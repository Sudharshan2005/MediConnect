import React, { useEffect, useRef, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const VideoConsultation = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    initializeCall();
    return () => {
      endCall();
    };
  }, []);

  useEffect(() => {
    let interval;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsCallActive(true);
      
      // For demo purposes, simulate remote connection
      setTimeout(() => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      }, 2000);

      toast.success('Call connected successfully');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Could not access camera/microphone');
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioOn(!isAudioOn);
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }
    setIsCallActive(false);
    toast.info('Call ended');
    setTimeout(() => navigate('/patient/dashboard'), 2000);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages([
        ...chatMessages,
        {
          id: Date.now(),
          sender: user.name,
          text: newMessage,
          time: new Date().toLocaleTimeString()
        }
      ]);
      setNewMessage('');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                Video Consultation - {meetingId}
                <Badge bg="success" className="ms-2">
                  {formatDuration(callDuration)}
                </Badge>
              </h5>
              <div>
                <Button
                  variant={isVideoOn ? 'outline-primary' : 'danger'}
                  size="sm"
                  className="me-2"
                  onClick={toggleVideo}
                >
                  {isVideoOn ? '📹 On' : '📹 Off'}
                </Button>
                <Button
                  variant={isAudioOn ? 'outline-primary' : 'danger'}
                  size="sm"
                  className="me-2"
                  onClick={toggleAudio}
                >
                  {isAudioOn ? '🎤 On' : '🎤 Off'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={endCall}
                >
                  📞 End Call
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-0" style={{ height: '500px' }}>
              <div className="position-relative h-100">
                {/* Remote Video */}
                <div className="h-100 w-100 bg-dark">
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="h-100 w-100 object-fit-contain"
                    />
                  ) : (
                    <div className="d-flex flex-column justify-content-center align-items-center h-100 text-white">
                      <div className="spinner-border mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p>Waiting for doctor to join...</p>
                    </div>
                  )}
                </div>

                {/* Local Video */}
                <div className="position-absolute bottom-0 end-0 m-3" style={{ width: '200px' }}>
                  {localStream && (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-100 rounded shadow"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Call Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6>Call Details</h6>
                  <p className="mb-2">
                    <strong>Meeting ID:</strong> {meetingId}
                  </p>
                  <p className="mb-2">
                    <strong>Duration:</strong> {formatDuration(callDuration)}
                  </p>
                  <p className="mb-0">
                    <strong>Status:</strong> {isCallActive ? 'Active' : 'Ended'}
                  </p>
                </Col>
                <Col md={6}>
                  <h6>Connection Status</h6>
                  <p className="mb-2">
                    <Badge bg={isVideoOn ? 'success' : 'danger'}>
                      Camera: {isVideoOn ? 'On' : 'Off'}
                    </Badge>
                  </p>
                  <p className="mb-2">
                    <Badge bg={isAudioOn ? 'success' : 'danger'}>
                      Microphone: {isAudioOn ? 'On' : 'Off'}
                    </Badge>
                  </p>
                  <p className="mb-0">
                    <Badge bg={remoteStream ? 'success' : 'warning'}>
                      Doctor: {remoteStream ? 'Connected' : 'Connecting...'}
                    </Badge>
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">
                💬 Chat
              </h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column" style={{ height: 'calc(100% - 60px)' }}>
              <div className="flex-grow-1 overflow-auto mb-3">
                {chatMessages.length > 0 ? (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-2 p-2 rounded ${
                        message.sender === user.name
                          ? 'bg-primary text-white align-self-end'
                          : 'bg-light align-self-start'
                      }`}
                      style={{ maxWidth: '80%' }}
                    >
                      <div className="small">
                        <strong>{message.sender}</strong>
                        <span className="ms-2 opacity-75">{message.time}</span>
                      </div>
                      <div className="mt-1">{message.text}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted my-5">
                    <div className="display-4 mb-3">💬</div>
                    <p>No messages yet</p>
                    <p className="small">Start the conversation</p>
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button
                    variant="primary"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VideoConsultation;