import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import "../css/ModalProgress.css";

interface ConfirmationModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
  success?: boolean;
}


const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  onHide,
  onConfirm,
  message,
  loading,
  success,
}) => {
  return (
    <Modal contentClassName='custom-modal' show={show} onHide={onHide} centered >
      <Modal.Header closeButton>
      
      </Modal.Header>

      <Modal.Body>
      {loading ? (
      <div className="d-flex justify-content-center align-items-center flex-column">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Sending...</span>
        </div>
        <span className="mt-2" style={{ fontFamily: "Poppins, sans-serif", color: "#2169ac" }}>
          Processing your report...
        </span>
      </div>
    ) : success ? (
      <div className="d-flex justify-content-center align-items-center flex-column">
        <div className="check-container pb-1">
          <div className="check-background">
            <svg viewBox="0 0 65 51" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 25L27.3077 44L58.5 7" stroke="white" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <span className="mt-2" style={{ fontFamily: "Poppins, sans-serif", color: "#2169ac" }}>
          Report submitted successfully!
        </span>
      </div>
    ) : (
      <p className="p-2" style={{
        color:'#2169ac',
        fontFamily: "Poppins, sans-serif",
        fontSize:'16.4px',
      }}>
        {message}
      </p>
    )}
  </Modal.Body>

  {!loading && !success && (
    <Modal.Footer>
      <Button onClick={onHide} style={{
        backgroundColor:' #e86b70',
        color:'white',
        fontSize:'13px',
        outline:'none',
        border:'none',
        fontFamily: "Poppins, sans-serif",
      }}>
        Cancel
      </Button>
      <Button onClick={onConfirm} style={{
        backgroundColor:'#67d753',
        color:'white',
        fontSize:'13px',
        outline:'none',
        border:'none',
        fontFamily: "Poppins, sans-serif",
      }}>
        Confirm
      </Button>
    </Modal.Footer>
  )}
    </Modal>
  );
};

export default ConfirmationModal;
