import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  onChatroomSelect?: (chatId: string) => void; 
  selectedUserId: string | null;
}

const Messages = ({ onChatSelect }: MessagesProps) => {
  const [messages, setMessages] = useState<{ [key: string]: MessageData }>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [sortedChats, setSortedChats] = useState<[string, MessageData][]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const { currentUser } = useContext(AuthContext);
  const chatContext = useContext(ChatContext);
  const fetchedNamesRef = useRef<{ [uid: string]: string }>({});
  const { chatId } = useParams();
  const prevSelectedUserId = useRef<string | null>(null); 
  
 const navigate = useNavigate();

 function createChatId(uid1: string, uid2: string) {
  return uid1 > uid2 ? uid1 + uid2 : uid2 + uid1;
}

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
      // Get timestamps (fall back to 0 if undefined)
      const timestampA = a[1].lastMessage?.timestamp || a[1].lastActivity?.seconds || 0;
      const timestampB = b[1].lastMessage?.timestamp || b[1].lastActivity?.seconds || 0;
  
      return timestampB - timestampA; // Sort in descending order
    });
    setSortedChats(sorted);
  }, [messages]);


    useEffect(() => {
      if (!chatId || !sortedChats.length) return;
    
      const matchedChat = sortedChats.find(([key]) => key === chatId);
      if (!matchedChat) {
        console.warn('No matching chat found for chatId:', chatId);
        return; // Early return if no chat is found
      }
    
      const userInfo = matchedChat[1].userInfo;
      if (!userInfo?.uid) return; // Early return if no userInfo
      
      if (userInfo.uid !== prevSelectedUserId.current) {
        console.log('Switching user based on chatId from URL:', chatId);
        chatContext?.dispatch({ type: 'CHANGE_USER', payload: userInfo });
        setSelectedUserId(userInfo.uid);
        prevSelectedUserId.current = userInfo.uid; // Update reference
        onChatSelect?.();
      }
    }, [chatId, sortedChats, chatContext, selectedUserId, onChatSelect, currentUser]);

    const handleSelect = useCallback((userInfo: MessageData['userInfo']) => {
      if (!currentUser?.uid) {
        return;
      }
      const newChatId = createChatId(currentUser.uid, userInfo.uid);
    
      if (!newChatId) {
        console.log("Generated chatId is invalid:", newChatId);
        return;
      }
      navigate(`/inquiries/${newChatId}`);
      chatContext?.dispatch({ type: 'CHANGE_USER', payload: userInfo });
      prevSelectedUserId.current = userInfo.uid;
      setSelectedUserId(userInfo.uid);
      if (onChatSelect) {
        onChatSelect();
      }
      
    }, [chatContext, onChatSelect, currentUser, navigate]);

  if (!currentUser?.uid) return <div>Loading user...</div>;

  

  return (
    <div className="messages" style={{ overflowY: 'auto' }}>
       {isLoading ? (
        <div>Loading messages...</div> 
      ) : (
        sortedChats.length === 0 ? (
          <div>No conversations yet.</div>
        ) : (
          sortedChats .filter(([_, msg]) => msg.lastMessage?.text?.trim())
          .map(([key, msg]) => {
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
