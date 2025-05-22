import { db } from '../src/firebase';
import { doc, updateDoc, arrayUnion, Timestamp, serverTimestamp } from 'firebase/firestore';
import { v4 as uuid } from 'uuid';

export const handleSend = async (
    setText: React.Dispatch<React.SetStateAction<string>>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    customText: string | undefined,
    chatData: any,
    currentUser: any,
    reportId?: string | undefined,
    type?: 'Inquiry' | 'Appeal',
) => {
    if (!currentUser?.uid || !chatData.chatId || !chatData.user?.uid) return;

    const displayName = currentUser.firstName + currentUser.lastName;

    let finalText = customText?.trim() || '';

    if (type === 'Inquiry') {
        finalText = `Inquiry about Report ID: ${reportId}`;
    } else if (type === 'Appeal') {
        finalText = `I want to review this item\nClaim ID: ${reportId}`;
    }

    if (!finalText) return;

    const messageId = uuid();
    const messageData = {
      id: messageId,
      text: finalText,
      senderId: currentUser.uid,
      date: Timestamp.now(),
    };


    try {
        const chatRef = doc(db, 'chats', chatData.chatId);
        await updateDoc(chatRef, {
            messages: arrayUnion(messageData),
            timestamp: serverTimestamp(),
        });

        const lastMessage = {
          text: finalText,
          senderId: currentUser.uid,
        };

        const currentUserChatRef = doc(db, 'userChats', currentUser.uid);
        const receiverUserChatRef = doc(db, 'userChats', chatData.user.uid);

        await updateDoc(currentUserChatRef, {
            [`${chatData.chatId}.lastMessage`]: lastMessage,
            [`${chatData.chatId}.timestamp`]: serverTimestamp(),
            [`${chatData.chatId}.userInfo`]: {
                uid: chatData.user.uid,
                name: chatData.user.name,
            },
        });

        await updateDoc(receiverUserChatRef, {
            [`${chatData.chatId}.lastMessage`]: lastMessage,
            [`${chatData.chatId}.timestamp`]: serverTimestamp(),
            [`${chatData.chatId}.userInfo`]: {
                uid: currentUser.uid,
                name: displayName,
            },
        });

        setText('');
        setFile(null);
        console.log('Message successfully sent!');
    } catch (error) {
        console.error('Error sending message:', error);
    }
};
