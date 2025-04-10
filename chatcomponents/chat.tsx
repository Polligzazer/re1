import '../css/inquiries.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Input from './input';
import ChatContainer from '../chatcomponents/chatcontainer';
import { useChatContext } from '../components/ChatContext';

interface ChatProps {
  onBack?: () => void;
}

const Chat = ({ onBack }: ChatProps) => {
  const { data } = useChatContext();

  return (
    <div className="chat">
      <div
        className="chatInfo p-2 d-flex flex-row align-items-center"
        style={{
          backgroundColor: '#004aad',
          borderTopLeftRadius: '23px',
          borderTopRightRadius: '23px',
          borderBottomLeftRadius: '0px',
          borderBottomRightRadius: '0px',
        }}
      >
       
        {onBack && (
          <button
            onClick={onBack}
            className="btn btn-link text-white p-0 px-2 d-md-none"
            style={{ fontSize: '20px' }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
        )}

        
        <FontAwesomeIcon
          className="fs-2 p-3 pe-2"
          style={{
            color: '#e8a627',
          }}
          icon={faUser}
        />

       
        <span
          className="ps-2 align-self-center"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 'bold',
            fontSize: '19.4px',
            color: 'white',
          }}
        >
          {data?.user?.name || 'Select a chat'}
        </span>
      </div>

      
      <ChatContainer />

      
      <Input />
    </div>
  );
};

export default Chat;
