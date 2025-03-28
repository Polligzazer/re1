import { useState, useEffect, useContext, useRef } from 'react';
import '../css/inquiries.css';
import 'font-awesome/css/font-awesome.min.css';
import { db } from '../src/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { AuthContext } from '../components/Authcontext';
import { ChatContext } from '../components/ChatContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

interface MessageData {
  date: any;
  userInfo: {
    uid: string;
    name: string | null;
  };
  lastMessage?: {
    text?: string;
    senderId?: string;
  };
  messageCount?: number;
}

interface MessagesProps {
  onChatSelect?: () => void;
}

const Messages = ({ onChatSelect }: MessagesProps) => {
  const [messages, setMessages] = useState<{ [key: string]: MessageData }>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [forcedVisibleChats, setForcedVisibleChats] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem('forcedVisibleChats');
    return saved ? JSON.parse(saved) : {};
  });

  const { currentUser } = useContext(AuthContext);
  const chatContext = useContext(ChatContext);
  const fetchedNamesRef = useRef<{ [uid: string]: string }>({});

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsub = onSnapshot(doc(db, 'userChats', currentUser.uid), async (docSnap) => {
      if (docSnap.exists()) {
        const chatData = docSnap.data() as { [key: string]: MessageData };
        const updatedChats = { ...chatData };

        const fetchNames = async () => {
          await Promise.all(
            Object.entries(chatData).map(async ([key, msg]) => {
              const uid = msg.userInfo.uid;

              if (fetchedNamesRef.current[uid]) {
                updatedChats[key].userInfo.name = fetchedNamesRef.current[uid];
              } else {
                try {
                  const userDoc = await getDoc(doc(db, 'users', uid));
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                    const finalName = fullName || 'Unknown';
                    updatedChats[key].userInfo.name = finalName;
                    fetchedNamesRef.current[uid] = finalName;
                  } else {
                    updatedChats[key].userInfo.name = 'Unknown';
                    fetchedNamesRef.current[uid] = 'Unknown';
                  }
                } catch (err) {
                  console.error('Error fetching user name:', err);
                }
              }
            })
          );

          setMessages(updatedChats);
        };

        fetchNames();
      } else {
        setMessages({});
      }
    });

    return () => unsub();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid || currentUser?.isAdmin) return;

    const sorted = Object.entries(messages).sort((a, b) => b[1].date - a[1].date);
    if (sorted.length > 0) {
      const latest = sorted[0][1];
      if (latest.userInfo.uid !== selectedUserId) {
        chatContext?.dispatch({ type: 'CHANGE_USER', payload: latest.userInfo });
        setSelectedUserId(latest.userInfo.uid);
        onChatSelect?.();
      }
    }
  }, [messages, chatContext, selectedUserId, onChatSelect, currentUser]);

  const handleSelect = (userInfo: MessageData['userInfo']) => {
    if (!currentUser?.uid) return;

    const adminUid = currentUser.isAdmin ? currentUser.uid : userInfo.uid;
    const userUid = currentUser.isAdmin ? userInfo.uid : currentUser.uid;
    const combinedId = adminUid + userUid;

    chatContext?.dispatch({ type: 'CHANGE_USER', payload: userInfo });
    setSelectedUserId(userInfo.uid);
    onChatSelect?.();

    setForcedVisibleChats((prev) => {
      const updated = { ...prev, [combinedId]: true };
      localStorage.setItem('forcedVisibleChats', JSON.stringify(updated));
      return updated;
    });

    
  };

  if (!currentUser?.uid) return <div>Loading user...</div>;

  const filteredAndSortedMessages = Object.entries(messages)
    .filter(([key, msg]) => {
      const hasMessages = !!msg.lastMessage?.text || (msg.messageCount || 0) > 0;
      const isForcedVisible = forcedVisibleChats[key];
      const isSelectedUser = chatContext?.data.user?.uid === msg.userInfo.uid;

      return hasMessages || isForcedVisible || isSelectedUser;
    })
    .sort((a, b) => b[1].date - a[1].date);

  return (
    <div className="messages" style={{ overflowY: 'auto' }}>
      {filteredAndSortedMessages.length === 0 ? (
        <div>No conversations yet.</div>
      ) : (
        filteredAndSortedMessages.map(([key, msg]) => {
          const isActive = chatContext?.data.user?.uid === msg.userInfo.uid;
          const userDisplayName = msg.userInfo.name || 'Unknown';
          const lastName = userDisplayName.split(' ').slice(-1)[0];

          return (
            <div className="messagesselect" key={key} onClick={() => handleSelect(msg.userInfo)}>
              <button
                className={`chat-button w-100 bg-0 d-flex flex-row my-2 ${isActive ? 'active' : ''}`}
              >
                <FontAwesomeIcon
                  className="fs-2 p-3"
                  style={{ color: isActive ? '#e8a627' : '#2169ac' }}
                  icon={faUser}
                />
                <div className="fs-6 flex-column p-2 ps-0 text-start chatselect">
                  <span
                    style={{
                      color: isActive ? 'white' : '#2169ac',
                      fontFamily: 'Work Sans, serif',
                      fontWeight: 'bold',
                    }}
                  >
                    {userDisplayName}
                  </span>
                  <p
                    className="p-0 m-0"
                    style={{
                      color: isActive ? 'white' : '#2169ac',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    <small>
                      <span className="fw-bold">
                        {msg.lastMessage?.senderId === currentUser?.uid ? 'You:' : `${lastName}:`}
                      </span>{' '}
                      {msg.lastMessage?.text}
                    </small>
                  </p>
                </div>
              </button>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Messages;
