import { useState, useEffect } from 'react';
import '../css/inquiries.css';

import { useChatContext } from '../components/ChatContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../src/firebase';
import Convo from './conersation';

interface Message {
    id: string;
    text: string;
    senderId: string;
    date: any;
    fileType?: string;
}

const ChatContainer = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const { data } = useChatContext();

    useEffect(() => {
        if (!data.chatId) return;

        const unSub = onSnapshot(doc(db, 'chats', data.chatId), (docSnap) => {
            if (docSnap.exists()) {
                setMessages(docSnap.data().messages || []);
            }
        });

        return () => unSub();
    }, [data.chatId]);

    return (
        <div className="chatcontainer p-3 mt-4 mx-lg-3 mx-0 px-lg-5 px-4">
            {messages.length === 0 ? (
                <p className="text-muted">No messages yet.</p>
            ) : (
                messages.map((m, index) => (
                    <Convo 
                        key={m.id} 
                        message={m} 
                        previousMessage={index > 0 ? messages[index - 1] : undefined} 
                    />
                ))
            )}
        </div>
    );
};

export default ChatContainer;
