import '../css/inquiries.css';
import Chat from '../chatcomponents/chat.tsx';
import Sidebar from '../chatcomponents/sidebar.tsx';
import { useState, useEffect } from 'react';


const Inquiries = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showChat, setShowChat] = useState(window.innerWidth > 768);
  const [autoSelected, setAutoSelected] = useState(false);  // Start correct for screen size

  // ✅ Detect window resize, but don't toggle showChat unless needed
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);

      // ✅ If switching to desktop mode (above 768px), show both by default
      if (newWidth > 768) {
        setShowChat(true);
      }
      // ✅ If switching back to mobile, do NOT toggle showChat automatically
      // Leave it as is to avoid unexpected behavior
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (windowWidth > 768 && !autoSelected) {
      handleSelectChat(); // Auto-select
      setAutoSelected(true); // Prevent repeated auto-selection
    }
    if (windowWidth <= 768) {
      setAutoSelected(false); // Reset when back to mobile
    }
  }, [windowWidth, autoSelected]);

  const handleSelectChat = () => {
    if (windowWidth <= 768) {
      setShowChat(true); // Show chat, hide sidebar
    }
  };

  const handleBack = () => {
    if (windowWidth <= 768) {
      setShowChat(false); // Go back to sidebar
    }
  };

  return (
    <div className="main pt-4">
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
