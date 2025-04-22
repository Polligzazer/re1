import { Modal, Button } from "react-bootstrap"; // Using Bootstrap Modal for simplicity


interface PrivacyPreviewModalProps {
    show: boolean;
    onClose: () => void;
}

const PrivacyPreviewModal: React.FC<PrivacyPreviewModalProps> = ({ show, onClose }) => {
    return (
        <Modal show={show} onHide={onClose} centered backdrop="static" keyboard={false}>
            <Modal.Header closeButton>
                <Modal.Title
                            style={{
                                color:'#2169ac',
                                fontFamily: "Poppins, sans-serif",
                                fontSize:'16px'
                              }}>Privacy & Policy</Modal.Title>
            </Modal.Header>
            <Modal.Body
                        style={{
                            color:'#2169ac',
                            fontFamily: "Poppins, sans-serif",
                            fontSize:'14.4px'
                          }}>
                <p>📜 Privacy Policy <br />
                    We value your privacy. This Lost and Found application is designed to help students and staff recover lost items efficiently and securely.
                    <br />
                 <li>    We only collect basic information such as your name, student ID, and details about lost or found items. </li>
                    <br />
                 <li>    Your information is used only to match lost and found items and to notify you of updates. </li>
                    <br />
                 <li>  All information is stored securely and is only accessible to authorized school personnel. </li>
                    <br />
                 <li>   We do not share your personal information with third parties. </li>
                    <br />
                    By using this app, you agree to our privacy policy and understand that your information will be used solely for the purpose of managing lost and found reports within the school.
                </p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}
                          style={{
                            backgroundColor:' #e86b70',
                            color:'white',
                            fontSize:'13px',
                            outline:'none',
                            border:'none',
                            fontFamily: "Poppins, sans-serif",
                          }}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default PrivacyPreviewModal;
