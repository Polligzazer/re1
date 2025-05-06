import { db } from '../src/firebase';
import { doc, updateDoc, arrayUnion, Timestamp, serverTimestamp } from 'firebase/firestore';
import { v4 as uuid } from 'uuid';

export const handleSend = async (
    setText: React.Dispatch<React.SetStateAction<string>>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    customText: string,
    chatData: any,
    currentUser: any,
    reportId?: string | undefined,
) => {
    if (!customText?.trim()) return;
    if (!currentUser?.uid || !chatData.chatId || !chatData.user?.uid) return;

    const displayName = currentUser.firstName + currentUser.lastName;

    const inquiryLink = reportId
    ? `Inquiry about Report ID: ${reportId}`
    : '';

    const finalText = inquiryLink || customText || 'Sent a file';

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
