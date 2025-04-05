import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import '../css/inquiries.css';
import 'font-awesome/css/font-awesome.min.css';
import { db } from '../src/firebase';
import { doc, onSnapshot, getDoc, Timestamp } from 'firebase/firestore';
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
    timestamp?:number;
  };
  messageCount?: number;
  lastActivity?: Timestamp;
}

interface MessagesProps {
  onChatSelect?: () => void;
}

const Messages = ({ onChatSelect }: MessagesProps) => {
  const [messages, setMessages] = useState<{ [key: string]: MessageData }>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [sortedChats, setSortedChats] = useState<[string, MessageData][]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const { currentUser } = useContext(AuthContext);
  const chatContext = useContext(ChatContext);
  const fetchedNamesRef = useRef<{ [uid: string]: string }>({});

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsub = onSnapshot(doc(db, 'userChats', currentUser.uid), async (docSnap) => {
      setIsLoading(true);
      if (docSnap.exists()) {
        const chatData = docSnap.data() as { [key: string]: MessageData };
        const updatedChats = { ...chatData };

        await Promise.all(
          Object.entries(chatData).map(async ([key, msg]) => {
            const uid = msg.userInfo.uid;
            if (!fetchedNamesRef.current[uid]) { // Only fetch if not already fetched.
              try {
                const userDoc = await getDoc(doc(db, 'users', uid));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                  updatedChats[key].userInfo.name = fullName || 'Unknown';
                  fetchedNamesRef.current[uid] = fullName || 'Unknown';
                } else {
                  updatedChats[key].userInfo.name = 'Unknown';
                  fetchedNamesRef.current[uid] = 'Unknown';
                }
              } catch (err) {
                console.error('Error fetching user name:', err);
              }
            } else {
              updatedChats[key].userInfo.name = fetchedNamesRef.current[uid];
            }
          })
        );

        setMessages(updatedChats);
      } else {
        setMessages({});
      }
      setIsLoading(false); 
    });

    return () => unsub();
  }, [currentUser?.uid]);


  useEffect(() => {
    const sorted = Object.entries(messages).sort((a, b) => {
      const timestampA = a[1].lastActivity?.seconds || 0; // Use lastActivity timestamp
      const timestampB = b[1].lastActivity?.seconds || 0; // Use lastActivity timestamp
      return timestampB - timestampA; // Sort in descending order (latest first)
    });
    setSortedChats(sorted);
  }, [messages]);

    useEffect(() => {
      if (!currentUser?.uid || currentUser?.isAdmin) return;
      if (sortedChats.length > 0) {
        const latestChat = sortedChats[0][1];
        const currentSelected = chatContext?.data.user?.uid;
        if (latestChat.userInfo.uid !== currentSelected) {
            chatContext?.dispatch({ type: 'CHANGE_USER', payload: latestChat.userInfo });
            setSelectedUserId(latestChat.userInfo.uid);
            onChatSelect?.();
        }
      }
    }, [sortedChats, chatContext, selectedUserId, onChatSelect, currentUser]);


    const handleSelect = useCallback((userInfo: MessageData['userInfo']) => {
      if (!currentUser?.uid) return;
      chatContext?.dispatch({ type: 'CHANGE_USER', payload: userInfo });
      setSelectedUserId(userInfo.uid);
      onChatSelect?.();
  }, [chatContext, onChatSelect, currentUser]);

  if (!currentUser?.uid) return <div>Loading user...</div>;

  

  return (
    <div className="messages" style={{ overflowY: 'auto' }}>
       {isLoading ? ( // Show loading indicator if isLoading is true
        <div>Loading messages...</div> 
      ) : (
        sortedChats.length === 0 ? (
          <div>No conversations yet.</div>
        ) : (
          sortedChats.map(([key, msg]) => {
            const isActive = chatContext?.data.user?.uid === msg.userInfo.uid;
            const userDisplayName = msg.userInfo.name || 'Unknown';
            const lastName = userDisplayName.split(' ').slice(-1)[0]

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
                      {msg.lastMessage?.text
                        ? msg.lastMessage.text.length > 20
                          ? msg.lastMessage.text.slice(0, 20) + '...'
                          : msg.lastMessage.text
                        : ''}
                    </small>

                  </p>
                </div>
              </button>
            </div>
          );
        })
        )
      )}
    </div>
  );
};

export default Messages;
