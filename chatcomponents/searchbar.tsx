import { useState, useContext, useEffect } from 'react';
import '../css/inquiries.css';
import { db } from '../src/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { AuthContext } from "../components/Authcontext";
import { ChatContext } from "../components/ChatContext";
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

interface User {
  uid: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: string;
  isAdmin?: boolean;
}

interface SearchBarProps {
  onChatSelect?: () => void;
}

const SearchBar = ({ onChatSelect }: SearchBarProps) => {
  const [schoolId, setSchoolId] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);

  const { currentUser } = useContext(AuthContext) as { currentUser: User | null };
  const chatContext = useContext(ChatContext);

  useEffect(() => {
    if (!currentUser) return;

    const fetchAdmin = async () => {
      const q = query(collection(db, 'users'), where('isAdmin', '==', true));
      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0];
          const data = docData.data();
          setAdminUser({
            uid: docData.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            role: data.role || 'Admin',
            schoolId: data.schoolId || '',
            isAdmin: true
          });
        }
      } catch (error) {
        console.error("Error fetching admin:", error);
      }
    };

    if (!currentUser.isAdmin) {
      fetchAdmin();
    }
  }, [currentUser]);

  const handleSearch = async () => {
    if (!schoolId.trim()) {
      setErr("Please enter a valid School ID.");
      setUser(null);
      return;
    }

    const q = query(collection(db, 'users'), where('schoolId', '==', schoolId.trim()));

    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setErr('User not found');
        setUser(null);
        return;
      }

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        setUser({
          uid: doc.id,
          schoolId: userData.schoolId || "",
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          role: userData.role || "",
          isAdmin: userData.isAdmin || false
        });
      });

      setErr(null);
    } catch (error) {
      console.error("Firestore Query Error:", error);
      setErr('An error occurred while searching.');
      setUser(null);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSelect = async (selectedUser: User) => {
    if (!currentUser?.uid || !selectedUser?.uid) {
      alert("Error: Invalid user selection.");
      return;
    }
  
    const adminUid = currentUser.isAdmin ? currentUser.uid : selectedUser.uid;
    const userUid = currentUser.isAdmin ? selectedUser.uid : currentUser.uid;
    const combinedId = adminUid + userUid;
  
    chatContext?.dispatch({
      type: "CHANGE_USER",
      payload: {
        uid: selectedUser.uid,
        name: `${selectedUser.firstName} ${selectedUser.lastName}`.trim(),
      }
    });
  
    onChatSelect?.();
  
    setUser(null);
    setSchoolId("");

    const forcedVisible = JSON.parse(localStorage.getItem("forcedVisibleChats") || "{}");
  
    if (!forcedVisible[combinedId]) {
      forcedVisible[combinedId] = true;
      localStorage.setItem("forcedVisibleChats", JSON.stringify(forcedVisible));
    }
  
    try {
      const chatRef = doc(db, "chats", combinedId);
      const chatSnap = await getDoc(chatRef);
  
      if (!chatSnap.exists()) {
        await setDoc(chatRef, { messages: [] });
      }
  
      const formattedSelectedUser = {
        date: serverTimestamp(),
        userInfo: {
          uid: selectedUser.uid,
          schoolId: selectedUser.schoolId || "N/A",
          name: `${selectedUser.firstName} ${selectedUser.lastName}`.trim(),
          role: selectedUser.role || "N/A"
        },
        persistedSelection: true
      };
  
      const formattedCurrentUser = {
        date: serverTimestamp(),
        userInfo: {
          uid: currentUser.uid,
          schoolId: currentUser.schoolId || "N/A",
          name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
          role: currentUser.role || "N/A"
        }
      };
  
      await Promise.all([
        updateDoc(doc(db, "userChats", currentUser.uid), {
          [combinedId]: formattedSelectedUser
        }),
        updateDoc(doc(db, "userChats", selectedUser.uid), {
          [combinedId]: formattedCurrentUser
        })
      ]);
  
      console.log("Firestore chat setup completed.");
    } catch (err) {
      console.error("Firestore error:", err);
      alert(`Error: ${(err as Error).message}`);
    }
  
   
  };
  

  return (
    <div className="searchbar">
      {currentUser?.isAdmin ? (
        <>
          <input
            type="text"
            placeholder="  Find a user by School ID..."
            className="w-100 p-2 mb-3"
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            onKeyDown={handleKey}
            style={{
              backgroundColor: "#dfe8f5",
              borderRadius: "17px",
              fontSize: "10.8px",
              border: "1px solid #2169ac",
              color: "#212020"
            }}
          />
          {err && <span className="error">{err}</span>}

          {user && (
            <div
              className="users p-0 py-1 fs-6 d-flex flex-row"
              onClick={() => handleSelect(user)}
              style={{
                backgroundColor: '#004aad',
                color: 'white',
                fontFamily: 'Poppins, sans-serif',
                borderRadius: '18px',
                cursor: 'pointer'
              }}
            >
              <div className="p-2 text-center">
                <FontAwesomeIcon
                  className='fs-1 p-3'
                  style={{ color: '#e8a627' }}
                  icon={faUser}
                />
              </div>
              <div className="p-2">
                <p className="m-0 p-0">
                  <small><span>School ID:</span> {user.schoolId} </small>
                </p>
                <p className="m-0 p-0">
                  <small><span>Name:</span> {user.firstName} {user.lastName} </small>
                </p>
                <p className="m-0 p-0">
                  <small><span>Role:</span> {user.role} </small>
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <button
          className="w-100 p-2 mb-3"
          onClick={() => {
            if (adminUser) {
              handleSelect(adminUser);
            } else {
              alert("No admin available to message.");
            }
          }}
          style={{
            backgroundColor: '#004aad',
            color: 'white',
            fontFamily: 'Poppins, sans-serif',
            borderRadius: '17px',
            fontSize: '12px',
            border: '1px solid #2169ac'
          }}
        >
          Message Admin
        </button>
      )}
    </div>
  );
};

export default SearchBar;
