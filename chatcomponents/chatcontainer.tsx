import { useState, useEffect, useRef } from 'react';
import '../css/inquiries.css';
import { useChatContext } from '../components/ChatContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../src/firebase';
import Convo from './conersation';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';


interface Message {
  id: string;
  text: string;
  senderId: string;
  date: any;
  fileType?: string;
}

const ChatContainer = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const virtuosoRef = useRef<VirtuosoHandle>(null); 
  const { data } = useChatContext();
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    if (!data.chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const unSub = onSnapshot(doc(db, 'chats', data.chatId), (docSnap) => {
      if (docSnap.exists()) {
        const sortedMessages = (docSnap.data().messages || []).sort(
          (a: Message, b: Message) => a.date - b.date
        );
        setMessages(sortedMessages);
      }
      setTimeout(() => setLoading(false), 500);
    });

    return () => {
      unSub();
    };
  }, [data.chatId]);

  useEffect(() => {
    if (!loading && virtuosoRef.current && messages.length > 0) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length ,
        align: 'end', behavior:'auto'
      });
    }
  }, [messages, data.chatId, loading]);

  return (
    <div className="chatcontainermain p-3 mt-4 mx-lg-3 mx-0 px-lg-5 px-4">
     {!data.chatId ? (
        <div className="text-muted text-center py-5">Please select a message</div>
      ) : loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
    ) : messages.length === 0 ? (
      <p className="text-muted">No messages yet.</p>
    ) : (
        <Virtuoso
          ref={virtuosoRef} 
          className="chatcontainer"
          totalCount={messages.length}
          itemContent={(index) => (
            <div key={messages[index].id}>
              <Convo
                message={messages[index]}
                previousMessage={index > 0 ? messages[index - 1] : undefined}
              />
            </div>
          )}
          
        />
      )}
    </div>
  );
};

export default ChatContainer;
