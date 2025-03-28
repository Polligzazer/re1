import '../css/inquiries.css';
import Searchbar from '../chatcomponents/searchbar.tsx';
import Messages from '../chatcomponents/messages.tsx';

interface SidebarProps {
    onChatSelect: () => void; 
  }
  
  const Sidebar = ({ onChatSelect }: SidebarProps) => {
    return (
      <div className="sidebar p-2 d-flex flex-column">
        <p className="messageselection p-3 pb-0">Messages</p>
        <Searchbar />
        <Messages onChatSelect={onChatSelect} /> 
      </div>
    );
  };
  
  export default Sidebar;
  
