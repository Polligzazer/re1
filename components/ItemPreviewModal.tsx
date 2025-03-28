import { Modal, Button } from "react-bootstrap"; // Using Bootstrap Modal for simplicity
import { Item } from "./types"; // Adjust path as needed
import { useContext, useMemo } from "react";
import { AuthContext } from "../components/Authcontext"; // Adjust the path if needed
import { apwstorage, APPWRITE_STORAGE_BUCKET_ID } from "../src/appwrite";

interface ItemPreviewModalProps {
  show: boolean;
  onClose: () => void;
  item: Item | null;
}

const ItemPreviewModal = ({ show, onClose, item }: ItemPreviewModalProps) => {
  const { currentUser } = useContext(AuthContext);

  const imageUrl = useMemo(() => {
    if (!item?.imageUrl) return "";
    try {
      const url = apwstorage.getFilePreview(APPWRITE_STORAGE_BUCKET_ID, item.imageUrl);
      console.log("Generated Image URL:", url);
      return url;
    } catch (error) {
      console.error("Error fetching Appwrite image preview:", error);
      return "";
    }
  }, [item?.imageUrl]);

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{currentUser?.isAdmin ? "Report Details" : "Item"}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="modal-body-custom">
        {item ? (
          <div>
            <p><strong>Item:</strong> {item.item} ({item.category})</p>
            <p><strong>Location:</strong> {item.location}</p>
            <p><strong>Date:</strong> {item.date}</p>
            <span><strong>Reference Id:</strong> {item.id}</span>

            {currentUser?.isAdmin && (
              <>
                <hr />
                <p className="text-wrap"><strong>Description:</strong> <span className="text-wrap">{item.description || "No description provided"}</span></p>
                <p><strong>Reported By:</strong> {item.userId || "Unknown"}</p>

                
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={item.category}
                        className="img-fluid rounded shadow mt-2"
                        onError={(e) => {
                            console.error("Image failed to load:", e.currentTarget.src);
                            e.currentTarget.style.display = "none";
                          }}
                    />
                    )}

              </>
            )}
          </div>
        ) : (
          <p>No item details available.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ItemPreviewModal;
