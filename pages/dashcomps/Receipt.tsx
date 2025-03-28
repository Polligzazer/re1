import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface ReceiptProps {
    show: boolean;
    onClose: () => void;
    claimantName: string;
    referencePostId: string;
    itemName: string;
    dateClaimed: string;
    contactInfo: string;
}

const Receipt: React.FC<ReceiptProps> = ({
    show,
    onClose,
    claimantName,
    referencePostId,
    itemName,
    dateClaimed,
    contactInfo,
}) => {
    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Claim Receipt</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="receipt-container p-3 border rounded bg-light">
                    <h4 className="text-center mb-3">Receipt of Claim Approval</h4>
                    <p><strong>Claimant Name:</strong> {claimantName}</p>
                    <p><strong>Reference Post ID:</strong> {referencePostId}</p>
                    <p><strong>Item Name:</strong> {itemName}</p>
                    <p><strong>Date Claimed:</strong> {dateClaimed}</p>
                    <p><strong>Contact Information:</strong> {contactInfo}</p>
                    <p className="text-success fw-bold mt-3">Status: Resolved</p>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default Receipt;
