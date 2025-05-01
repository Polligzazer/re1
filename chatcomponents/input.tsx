import { useState, useContext, useEffect } from "react";
import { ID } from "appwrite";
import { apwstorage, APPWRITE_STORAGE_BUCKET_ID } from "../src/appwrite";
import { db } from "../src/firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  Timestamp,
  serverTimestamp,
  increment,
  writeBatch,
} from "firebase/firestore";
import { v4 as uuid } from "uuid";
import { useChatContext } from "../components/ChatContext";
import { AuthContext } from "../components/Authcontext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip, faPaperPlane, faFileAlt } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import { Modal } from "react-bootstrap";

const Input = () => {
  const [text, setText] = useState("");    
  const [file, setFile] = useState<File | null>(null);
  const { data } = useChatContext();
  const { currentUser, isAdmin } = useContext(AuthContext);
  const [isFileUploading, setIsFileUploading] = useState(false);
   const [showLoadingModal, setShowLoadingModal] = useState(false);

  useEffect(() => {
    console.log("Current Role:", currentUser?.role);
    console.log("Is Admin:", isAdmin);
  }, [currentUser, isAdmin]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
  
    const selectedFile = e.target.files[0];
    setIsFileUploading(true);
    setShowLoadingModal(true)
    try {
      const uploadedFile = await apwstorage.createFile(
        APPWRITE_STORAGE_BUCKET_ID,
        ID.unique(),
        selectedFile
      );
  
      const fileUrl = apwstorage.getFileView(
        APPWRITE_STORAGE_BUCKET_ID,
        uploadedFile.$id
      );
  
      console.log("✅ File uploaded successfully:", fileUrl);
  
      setText((prev) => prev + `\n${fileUrl}`);
      setFile(selectedFile);
      setIsFileUploading(false);
      setShowLoadingModal(false)
    } catch (error) {
      console.error("❗ Error uploading file:", error);
      alert("❗ Failed to upload file. Please try again.");
    }
  };

  const handleSend = async () => {
    if (!text.trim() && !file) return;
    if (!currentUser?.uid || !data.chatId || !data.user?.uid) return;

    const messageId = uuid();
    const messageData = {
      id: messageId,
      text,
      senderId: currentUser.uid,
      date: Timestamp.now(),
    };

    setText("");
    setFile(null);

    try {
      let fileUrl: string | null = null;
      let fileType: string | null = null;

      if (file) {
        try {
          const response = await apwstorage.createFile(APPWRITE_STORAGE_BUCKET_ID, ID.unique(), file);
          const fileId = response.$id;
          fileUrl = apwstorage.getFileView(APPWRITE_STORAGE_BUCKET_ID, fileId);

          const fileInfo = await apwstorage.getFile(APPWRITE_STORAGE_BUCKET_ID, fileId);
          fileType = fileInfo.mimeType; // e.g., 'video/mp4', 'image/png', etc.
        } catch (uploadError) {
          console.error("Appwrite upload failed:", uploadError);
          return;
        }
      }

      const finalMessage = fileUrl
        ? { ...messageData, img: fileUrl, fileType }
        : messageData;

      const batch = writeBatch(db);
      
    
      const chatRef = doc(db, 'chats', data.chatId);
      batch.update(chatRef, {
        messages: arrayUnion(finalMessage),
        timestamp: serverTimestamp(),
      });
  
     
      const lastMessage = {
        text: text || "Sent a file",
        senderId: currentUser.uid,
        senderName: currentUser.firstName || "Unknown User", 
        timestamp: serverTimestamp()
      };
  
     
      const receiverUserChatRef = doc(db, "userChats", data.user.uid);
      batch.update(receiverUserChatRef, {
        [`${data.chatId}.lastMessage`]: lastMessage,
        [`${data.chatId}.userInfo`]: {
          uid: currentUser.uid,
          name: currentUser.firstName 
        },
        [`${data.chatId}.messageCount`]: increment(1)
      });

      const senderUserChatRef = doc(db, "userChats", currentUser.uid);
      batch.update(senderUserChatRef, {
        [`${data.chatId}.lastMessage`]: lastMessage,
        [`${data.chatId}.userInfo`]: {
          uid: data.user.uid,
        },
        [`${data.chatId}.messageCount`]: increment(1)
      });

      
  
      await batch.commit();
      console.log('Message committed successfully');
  
      setText("");
      setFile(null);
  
    } catch (error) {
      console.error("Message send failed:", error);
     
    }
  };

  const handleSendClaimFormRequest = async () => {
    if (!currentUser?.uid || !data.chatId || !data.user?.uid) return;

    const messageId = uuid();
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 30);

     const deadline = new Date(Timestamp.now().toMillis() + 30 * 60 * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    console.log("Computed deadline:", deadline);

    const claimFormMessage = {
      id: messageId,
      text: `🔔 **Note!** This form is only valid for 30 minutes. Please submit it before **${deadline}**. Failing to comply will result in rejection of the claim request. Thank you!`,
      senderId: currentUser.uid,
      date: Timestamp.now(),
      claimFormRequest: true,
        validUntil: Timestamp.fromDate(expiryTime),
    };

    console.log("Sending claim form request:", claimFormMessage);

    try {
      const chatRef = doc(db, "chats", data.chatId);
      await updateDoc(chatRef, {
        messages: arrayUnion(claimFormMessage),
        timestamp: serverTimestamp(),
      });

      const currentUserChatRef = doc(db, "userChats", currentUser.uid);
      const receiverUserChatRef = doc(db, "userChats", data.user.uid);

      await Promise.all([
        updateDoc(currentUserChatRef, {
          [`${data.chatId}.messageCount`]: increment(1), 
        }),
        updateDoc(receiverUserChatRef, {
          [`${data.chatId}.messageCount`]: increment(1),
        }),
      ]);

    } catch (error) {
      console.error("Error sending claim form request:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="input py-3 px-0 d-flex gap-lg-2 gap justify-content-center align-items-center">
      {isAdmin && (
        <button className="btn" style={{ backgroundColor: "transparent" }} onClick={handleSendClaimFormRequest}>
          <FontAwesomeIcon className="fs-3" style={{ color: "#e8a627" }} icon={faFileAlt} />
        </button>
      )}

      <input
        type="text"
        placeholder="Type message or attach file..."
        className="form-controli p-1 px-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <input type="file" id="fileInput" className="d-none" onChange={handleFileChange} />

      <label htmlFor="fileInput" className="btn btn-light">
        <FontAwesomeIcon icon={faPaperclip} />
      </label>

      <button className="btn btn-primary" onClick={handleSend}>
        <FontAwesomeIcon icon={faPaperPlane} />
      </button>
      <Modal show={showLoadingModal} onHide={() => setShowLoadingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isFileUploading ? "Uploading..." : "Upload Complete"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isFileUploading ? (
            <div className="d-flex justify-content-center align-items-center flex-column">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Logging In...</span>
              </div>
              <span className="mt-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#2169ac' }}>
                Uploading your file...
              </span>
            </div>
          ) : (
            <div className="d-flex justify-content-center align-items-center flex-column">
              <div className="check-container pb-1">
                <div className="check-background">
                  <svg viewBox="0 0 65 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 25L27.3077 44L58.5 7" stroke="white" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <span className="mt-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#2169ac' }}>
                File uploaded!
              </span>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer />
      </Modal>
    </div>
  );
};

export default Input;
