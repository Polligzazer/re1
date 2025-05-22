import { Modal, Button } from "react-bootstrap";
import { ClaimItem } from "./types";
import { useEffect, useMemo, useState } from "react";
import { apwstorage, APPWRITE_STORAGE_BUCKET_ID } from "../src/appwrite";
import { db } from "../src/firebase";
import { doc, getDoc } from "firebase/firestore";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ItemPreviewModalProps {
  show: boolean;
  onClose: () => void;
  item: ClaimItem | null;
}

const ClaimPreviewModal = ({ show, onClose, item }: ItemPreviewModalProps) => {
  const [userName, setUserName] = useState("");
  const [linkedPostData, setLinkedPostData] = useState<any>(null);

  const imageUrl = useMemo(() => {
    if (!item?.imageUrl) return "";
    if (item.imageUrl.startsWith("http")) return item.imageUrl;
    try {
      return apwstorage.getFilePreview(APPWRITE_STORAGE_BUCKET_ID, item.imageUrl);
    } catch (error) {
      console.error("Error fetching Appwrite image preview:", error);
      return "";
    }
  }, [item?.imageUrl]);

  useEffect(() => {
    const fetchUserNameAndLinkedReport = async () => {
      if (!item) return;

      try {
        // Get claimant's name
        const userRef = doc(db, "users", item.userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const fullName = `${data.firstName || ""} ${data.middleInitial || ""} ${data.lastName || ""}`;
          setUserName(fullName.trim() || "Admin");
        } else {
          setUserName("Unknown");
        }

        // Fetch linked lost item report
        if (item?.referencePostId) {
          const reportRef = doc(db, "lost_items", item.referencePostId);
          const reportSnap = await getDoc(reportRef);
          if (reportSnap.exists()) {
            setLinkedPostData(reportSnap.data());
          } else {
            setLinkedPostData(null);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchUserNameAndLinkedReport();
  }, [item]);

  return (
    <Modal
      contentClassName="custom-modal3"
      show={show}
      onHide={onClose}
      centered
      size="lg"
      style={{
        color: "#2169ac",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "14.4px" }}>
          Claim form details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body
        className="d-flex flex-column flex-lg-row justify-content-evenly"
        style={{ fontSize: "14px", width: "100%" }}
      >
        {item && (
          <div className="p-3 modal-custom d-flex flex-column">
            <div
              className="d-flex p-3 flex-row"
              style={{ backgroundColor: "#e8a627", color: "white" }}
            >
              <FontAwesomeIcon icon={faUser} style={{ fontSize: "26px" }} />
              <p className="p-0 m-1">
                <strong>{userName}</strong> (Claimant)
              </p>
            </div>
            <div className="p-2">
              <p className="p-0 my-2"><strong>Item Claimed:</strong> {item.itemName}</p>
              <p className="p-0 my-2"><strong>Category:</strong> {item.category}</p>
              <p className="p-0 my-2"><strong>Claimed from:</strong> {item.location}</p>
              <p className="p-0 my-2"><strong>Description:</strong> {item.description}</p>
              <p className="p-0 my-2"><strong>Claimed Date:</strong> {item.claimedDate?.toDate().toLocaleString()}</p>
              <p className="p-0 my-2"><strong>Reference ID:</strong> {item.id}</p>
            </div>
            {item.imageUrl && (
              <a href={item.imageUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={item.imageUrl}
                  alt={item.itemName}
                  style={{
                    width: "100%",
                    maxHeight: "250px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    marginTop: "10px",
                    cursor: "pointer",
                  }}
                  onError={(e) => {
                    console.error("Image failed to load:", e.currentTarget.src);
                    e.currentTarget.style.display = "none";
                  }}
                />
              </a>
            )}
          </div>
        )}

        {linkedPostData ? (
          <div className="p-3 modal-custom d-flex flex-column">
            <div
              className="d-flex p-3 flex-row"
              style={{ backgroundColor: "#2169ac", color: "white" }}
            >
              <FontAwesomeIcon icon={faUser} style={{ fontSize: "26px" }} />
              <p className="p-0 m-1"><strong>Admin</strong> (Finder)</p>
            </div>
            <div className="p-2">
              <p className="p-0 my-2"><strong>Found Item:</strong> {linkedPostData.item}</p>
              <p className="p-0 my-2"><strong>Category:</strong> {linkedPostData.category}</p>
              <p className="p-0 my-2"><strong>Found at:</strong> {linkedPostData.location}</p>
              <p className="p-0 my-2"><strong>Description:</strong> {linkedPostData.description}</p>
              <p className="p-0 my-2"><strong>Date Sighted:</strong> {linkedPostData.date}</p>
            </div>
            {linkedPostData.imageUrl && (
              <a
                href={linkedPostData.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={linkedPostData.imageUrl}
                  alt={linkedPostData.item}
                  style={{
                    width: "100%",
                    maxHeight: "250px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    marginTop: "10px",
                    cursor: "pointer",
                  }}
                  onError={(e) => {
                    console.error("Image failed to load:", e.currentTarget.src);
                    e.currentTarget.style.display = "none";
                  }}
                />
              </a>
            )}
          </div>
        ) : (
          <p className="text-muted">No linked reference post found or failed to load.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={onClose}
          style={{
            backgroundColor: "#e86b70",
            color: "white",
            fontSize: "13px",
            border: "none",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ClaimPreviewModal;
