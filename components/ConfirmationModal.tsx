import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import "../css/ModalProgress.css";

interface ConfirmationModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  onHide,
  onConfirm,
  message,
}) => {
  return (
    <Modal contentClassName='custom-modal' show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
      
      </Modal.Header>

      <Modal.Body>
        <p className="p-2" style={{
          color:'#2169ac',
          fontFamily: "Poppins, sans-serif",
          fontSize:'16.4px',
        }}>{message}</p>
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={onHide}style={{
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
    </Modal>
  );
};

export default ConfirmationModal;
