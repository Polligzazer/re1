import '../css/inquiries.css';
import Chat from '../chatcomponents/chat.tsx';
import Sidebar from '../chatcomponents/sidebar.tsx';
import { useState, useEffect } from 'react';


const Inquiries = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showChat, setShowChat] = useState(window.innerWidth > 768);
  const [autoSelected, setAutoSelected] = useState(false); 

  
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);

  
      if (newWidth > 768) {
        setShowChat(true);
      }
     
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (windowWidth > 768 && !autoSelected) {
      handleSelectChat(); 
      setAutoSelected(true);
    }
    if (windowWidth <= 768) {
      setAutoSelected(false);
    }
  }, [windowWidth, autoSelected]);

  const handleSelectChat = () => {
    if (windowWidth <= 768) {
      setShowChat(true);
    }
  };

  const handleBack = () => {
    if (windowWidth <= 768) {
      setShowChat(false); 
    }
  };

  return (
    <div className="main pt-4 mt-2">
      <div className="inquiries w-100 justify-content-center align-items-center d-flex">
        {(!showChat || windowWidth > 768) && (
          <Sidebar onChatSelect={handleSelectChat} />
        )}

        {(showChat || windowWidth > 768) && (
          <Chat onBack={handleBack} />
        )}
      </div>
    </div>
  );
};

export default Inquiries;
