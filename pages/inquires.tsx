import '../css/inquiries.css';
import Chat from '../chatcomponents/chat.tsx';
import Sidebar from '../chatcomponents/sidebar.tsx';
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/Authcontext.tsx';
import { useParams, useNavigate } from 'react-router-dom';

const Inquiries = () => {
  const { currentUser } = useContext(AuthContext); 
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showChat, setShowChat] = useState(window.innerWidth > 768);
  const [autoSelected, setAutoSelected] = useState(false); 
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { chatId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);

      if (newWidth > 768) {
        setShowChat(true);
      }
      console.log(`Window resized: ${newWidth}`);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    console.log(`Window width changed to: ${windowWidth}`);
    if (!currentUser?.isAdmin) {
      if (windowWidth > 768 && !autoSelected && selectedUser !== null) {
        handleSelectChat(null); 
      } else if (windowWidth <= 768 && autoSelected) {
        setAutoSelected(false);
      }
    }
  }, [windowWidth, autoSelected, currentUser?.isAdmin]);

  useEffect(() => {
    if (chatId) {
      if (!selectedUser || selectedUser.uid !== chatId) {
        handleSelectChat({ uid: chatId });
      }
    } else {
      handleSelectChat(null);
    }
  }, [chatId, selectedUser]);

  const handleSelectChat = (user: any = null) => {
    console.log("handleSelectChat triggered", user);
    setSelectedUser(user);

    if (user) {
      setShowChat(true);
      console.log(`User selected: ${user?.name || user?.uid || 'Unknown'}`);
      console.log("Chat window should now be visible.");
    } else {
      setShowChat(false);
      console.log("User deselected. Chat window hidden.");
    }
  };

  const handleBack = () => {
    console.log("Back button pressed");
    if (windowWidth <= 768) {
      setShowChat(false); 
      setAutoSelected(false);
      setSelectedUser(null);
      navigate('/inquiries'); // Clear chatId from URL
      console.log("User deselected and chat window hidden.");
    }
  };

  console.log(`Current selectedUser:`, selectedUser);
  console.log(`Current showChat: ${showChat}`);
  console.log(`Current windowWidth: ${windowWidth}`);

  return (
    <div className="main pt-4 mt-2">
      <div className="inquiries justify-content-center align-items-center d-flex">
        {(!showChat || windowWidth > 768) && (
          <Sidebar onChatSelect={handleSelectChat} selectedUser={selectedUser} />
        )}

        {(showChat || windowWidth > 768) && (
          <Chat
            key={selectedUser?.uid || 'default'}
            onBack={handleBack}
            selectedUser={selectedUser}
          />
        )}
      </div>
    </div>
  );
};

export default Inquiries;
