import { useState, useContext, useEffect } from "react";
import { ID } from "appwrite";
import { apwstorage, APPWRITE_STORAGE_BUCKET_ID } from "../src/appwrite";
import { db, storage } from "../src/firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  Timestamp,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuid } from "uuid";
import { useChatContext } from "../components/ChatContext";
import { AuthContext } from "../components/Authcontext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip, faPaperPlane, faFileAlt } from "@fortawesome/free-solid-svg-icons";
import React from "react";

const Input = () => {
  const [text, setText] = useState("");    
  const [file, setFile] = useState<File | null>(null);
  const { data } = useChatContext();
  const { currentUser, isAdmin } = useContext(AuthContext);

  useEffect(() => {
    console.log("Current Role:", currentUser?.role);
    console.log("Is Admin:", isAdmin);
  }, [currentUser, isAdmin]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
  
    const selectedFile = e.target.files[0];
  
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

      if (file) {
        const storageRef = ref(storage, uuid());
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            (error) => {
              console.error('Upload error:', error);
              reject(error);
            },
            async () => {
              fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(fileUrl);
            }
          );
        });
      }

      const finalMessage = fileUrl
        ? { ...messageData, img: fileUrl }
        : messageData;

      const chatRef = doc(db, 'chats', data.chatId);
      await updateDoc(chatRef, {
        messages: arrayUnion(finalMessage),
        timestamp: serverTimestamp(),
      });

      const lastMessage = {
        text: text || "Sent a file",
        senderId: currentUser.uid,
      };

      const currentUserChatRef = doc(db, "userChats", currentUser.uid);
      const receiverUserChatRef = doc(db, "userChats", data.user.uid);

      await Promise.all([
        updateDoc(currentUserChatRef, {
          [`${data.chatId}.lastMessage`]: lastMessage,
          [`${data.chatId}.lastActivity`]: serverTimestamp(),
          [`${data.chatId}.userInfo`]: {
            uid: data.user.uid,
            name: data.user.name,
          },
          [`${data.chatId}.messageCount`]: increment(1),
        }),
        updateDoc(receiverUserChatRef, {
          [`${data.chatId}.lastMessage`]: lastMessage,
          [`${data.chatId}.lastActivity`]: serverTimestamp(),
          [`${data.chatId}.userInfo`]: {
            uid: currentUser.uid,
            name: currentUser.displayName,
          },
          [`${data.chatId}.messageCount`]: increment(1),
        })
      ]);

    } catch (error) {
      console.error("Error sending message:", error);
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
        className="form-control p-3"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          width: "20rem",
          borderRadius: "7px",
          backgroundColor: "#dfe8f5",
          border: "1px solid #2169ac",
        }}
      />

      <input type="file" id="fileInput" className="d-none" onChange={handleFileChange} />

      <label htmlFor="fileInput" className="btn btn-light">
        <FontAwesomeIcon icon={faPaperclip} />
      </label>

      <button className="btn btn-primary" onClick={handleSend}>
        <FontAwesomeIcon icon={faPaperPlane} />
      </button>
    </div>
  );
};

export default Input;
