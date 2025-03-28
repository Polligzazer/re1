import { Modal, Button } from "react-bootstrap"; // Using Bootstrap Modal for simplicity


interface PrivacyPreviewModalProps {
    show: boolean;
    onClose: () => void;
}

const PrivacyPreviewModal: React.FC<PrivacyPreviewModalProps> = ({ show, onClose }) => {
    return (
        <Modal show={show} onHide={onClose} centered backdrop="static" keyboard={false}>
            <Modal.Header closeButton>
                <Modal.Title>Privacy & Policy</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>This is the privacy policy content.</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default PrivacyPreviewModal;
