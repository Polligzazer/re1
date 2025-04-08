import { Modal, Button } from "react-bootstrap"; 
import { Item } from "./types"; 
import { useContext, useMemo } from "react";
import { AuthContext } from "../components/Authcontext"; 
import { apwstorage, APPWRITE_STORAGE_BUCKET_ID } from "../src/appwrite";
import { useState, useEffect } from 'react';
import { db } from '../src/firebase'; 
import { doc, getDoc } from 'firebase/firestore';

interface ItemPreviewModalProps {
  show: boolean;
  onClose: () => void;
  item: Item | null;
}

const ItemPreviewModal = ({ show, onClose, item }: ItemPreviewModalProps) => {
  const { currentUser } = useContext(AuthContext);
  const [userName, setUserName] = useState(''); 
  const [, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserName = async () => {
      if (item && item.userId) { 
        try {
          const userRef = doc(db, 'users', item.userId); 
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log(userData); 
            const fullName = `${userData?.firstName || ''} ${userData?.middleInitial || ''} ${userData?.lastName || ''}`;
            setUserName(fullName.trim() || 'Admin'); 
          } else {
            setUserName('User not found'); 
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          setUserName('Error fetching user');
        } finally {
          setLoading(false);
        }
      } else {
        setUserName('No userId found'); 
        setLoading(false);
      }
    };

    fetchUserName();
  }, [item]); 

  const imageUrl = useMemo(() => {
    if (!item?.imageUrl) return "";

    if (item.imageUrl.startsWith("http")) {
      return item.imageUrl;
    }
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
    <Modal contentClassName="custom-modal3" show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title 
            style={{
              color:'#2169ac',
              fontFamily: "Poppins, sans-serif",
              fontSize:'14px'
            }}>
          {currentUser?.isAdmin ? "Report Details" : "Item"}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="modal-body-custom"
            style={{
              color:'#2169ac',
              fontFamily: "Poppins, sans-serif",
              fontSize:'14.4px'
            }}>
        {item ? (
          <div>
             <p><strong>Reference Id:</strong> {item.id}</p>
            <p><strong>Item:</strong> {item.item} ({item.category})</p>
            <p><strong>Location:</strong> {item.location}</p>
            <p><strong>Date:</strong> {item.date}</p>
           

            {currentUser?.isAdmin && (
              <>
                <p className="text-wrap"><strong>Description:</strong> <span className="text-wrap">{item.description || "No description provided"}</span></p>
                <p><strong>Reported By:</strong> {userName || "Unknown"}</p>
                <p className="fw-bold">File attached: </p>
                
                {imageUrl && (
                  <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                 >
                    <img
                        src={imageUrl}
                        alt={item.category}
                        style={{ width: "100%", maxHeight: "250px", objectFit: "contain", borderRadius: "8px" }}

                        onError={(e) => {
                            console.error("Image failed to load:", e.currentTarget.src);
                            e.currentTarget.style.display = "none";
                          }}
                    />
                    </a>
                    )}

              </>
            )}
          </div>
        ) : (
          <p>No item details available.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose}
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

export default ItemPreviewModal;
