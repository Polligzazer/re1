import { useContext, useEffect, useRef, useState } from 'react';
import '../css/inquiries.css';
import { AuthContext } from '../components/Authcontext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import ItemPreviewModal from '../components/ItemPreviewModal';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { db } from '../src/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  senderId: string;
  date: any;
  fileType?: string;
  claimFormRequest?: boolean;
  validUntil?: any;
  img?: string;
}

interface Report {
  id: string;
  reportId: string;
  item: string;
  description: string;
  category: string;
  location: string;
  date: string;
  imageUrl?: string;
  userId: string;
}

interface ConvoProps {
  message: Message;
  previousMessage?: Message;
  chatPartner?: {
    firstName: string;
    lastName: string;
  };
}

const Convo = ({ message, previousMessage, chatPartner }: ConvoProps) => {
  const { currentUser } = useContext(AuthContext);
  const ref = useRef<HTMLDivElement | null>(null);
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isExpired, setIsExpired] = useState(false);



  const fetchSingleReport = async (id: string) => {
    try {
      const reportDoc = await getDoc(doc(db, 'lost_items', id));
      if (reportDoc.exists()) {
        setSelectedReport({ id: reportDoc.id, ...reportDoc.data() } as Report);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };

useEffect(() => {
  if (message.validUntil) {
    const validUntilDate = message.validUntil.toDate
      ? message.validUntil.toDate()
      : new Date(message.validUntil);

      const checkExpiration = () => {
        setIsExpired(new Date() > validUntilDate);
      };

      checkExpiration();
      const interval = setInterval(checkExpiration, 60000); 
      return () => clearInterval(interval);
  }
}, [message.validUntil]);

  const isOwner = message.senderId === currentUser?.uid;
  const currentDate = message.date.toDate ? message.date.toDate() : new Date(message.date);
  
  let showMeta = false;
  
  if (!previousMessage?.date || !previousMessage?.senderId) {
    showMeta = true;
  } else {
    try {
      const prevDate = previousMessage.date.toDate?.() || new Date(previousMessage.date);
      const diffInMinutes = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60);
  
  
      if (diffInMinutes >= 30 || previousMessage.senderId !== message.senderId) {
        showMeta = true;
       
      }
    } catch (error) {
      showMeta = true; 
    }
  }

  const getLabel = () => {
    if (currentUser?.isAdmin) {
      return isOwner ? 'You' : chatPartner?.lastName || 'User';
    } else {
      return isOwner ? 'You' : 'Admin';
    }
  };

  const formatTimestamp = (dateObj: any) => {
    const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBubbleClick = () => setShowTimestamp((prev) => !prev);

  const handleInquireClick = (reportId: string) => {
    fetchSingleReport(reportId);
  };

  return (
    <div
  ref={ref}
  className={`message-convo ${isOwner ? 'owner' : 'admin'}`}
  style={{
    display: 'flex',
    flexDirection: isOwner ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    marginBottom: '5px',
    gap: '10px',
  }}
>
  <div style={{ width: '30px', minWidth: '30px', textAlign: 'center' }}>
    {showMeta && (
      <FontAwesomeIcon icon={faUser} className="fs-3" style={{ color: '#2169ac', marginTop: '2px' }} />
    )}
  </div>

  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwner ? 'flex-end' : 'flex-start' }}>
    {showMeta && (
      <span
        style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#2169ac',
          fontFamily: 'Work Sans, sans-serif',
          marginBottom: '3px',
        }}
      >
        {getLabel()}
      </span>
    )}

    <div
      onClick={handleBubbleClick}
      style={{
        backgroundColor: isOwner ? '#e3ecf7' : '#f5f5f5',
        color: '#333',
        borderRadius: '12px',
        padding: '10px 15px',
        maxWidth: '250px',
        cursor: 'pointer',
        fontFamily: 'Poppins, sans-serif',
        fontSize: '14px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        wordBreak: 'break-word',
        transition: 'background-color 0.2s',
      }}
    >
      {message.text.includes('Inquiry about Report ID:') ? (
        <>
          <span>Inquiring about</span>
          <Button
            className="btn btn-primary p-1 mt-2"
            style={{ textDecoration: 'none' }}
            onClick={() => {
              const reportIdMatch = message.text.match(/\bInquiry about Report ID:\s*([a-zA-Z0-9]+)\b/);
              const reportId = reportIdMatch ? reportIdMatch[1] : null;

              if (reportId) {
                console.log('Inquire Button Clicked! Report ID:', reportId);
                handleInquireClick(reportId.trim());
              }
            }}
          >
            Report ID: {message.text.match(/\bInquiry about Report ID:\s*([a-zA-Z0-9]+)\b/)?.[1]}
          </Button>
        </>
      ) : (
        <>
          {message.claimFormRequest ? (
            <>
              <p style={{ fontSize: '12px', marginBottom: '5px' }}>
                ⚠️ This claim form is only valid until {formatTimestamp(message.validUntil)}.
                <br /> <br />
                Failing to comply will result in rejection of the request.
                <br /> <br />
                Thank you!
              </p>
              <Link
                to="/report?claimForm=true"
                className="btn"
                style={{
                  fontSize: '13px',
                  textDecoration: 'none',
                  pointerEvents: isExpired ? 'none' : 'auto',
                  backgroundColor: isExpired ? '#d6d6d6' : 'transparent',
                  color: isExpired ? '#6c757d' : 'blue',
                  borderColor: isExpired ? '#d6d6d6' : 'blue',
                }}
              >
                {isExpired ? 'Claim Form Expired' : 'Complete Claim Form'}
              </Link>
            </>
          ) : (
            <>
            {
              message.img ? (
                // If it's an image or video, display it accordingly
                <div>
                  {message.fileType?.startsWith('video/') ? (
                    // If it's a video, use the <video> tag
                    <video
                      width="300"
                      controls
                      onError={() => console.log('Error loading video thumbnail')}
                      style={{maxWidth:'220px'}}
                    >
                      <source src={message.img} type={message.fileType} />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    // If it's an image, display it as an image
                    <img
                      src={message.img}
                      alt="Attachment"
                      style={{ maxWidth:'220px', borderRadius:'10px', backgroundColor: 'red', cursor: 'pointer' }}
                      onClick={() => window.open(message.img, '_blank')} // Open the image in a new tab when clicked
                    />
                  )}
                  
                  {message.text && <p style={{ margin: 0, padding: 0 }}></p>} {/* Render message.text if it exists */}
                </div>
              ) : message.text.includes('https://cloud.appwrite.io/v1/storage/buckets/') ? (
                <div>
                  <a href={message.text} target="_blank" rel="noopener noreferrer">
                    See attached file
                  </a>
                </div>
              ) : (
                <p style={{ margin: 0, padding: 0 }}>{message.text}</p>
              )
            }
            </>

          )}
        </>
      )}
    </div>

    <div
      style={{
        fontSize: '12px',
        color: '#999',
        fontFamily: 'Poppins, sans-serif',
        marginTop: '5px',
      }}
    >
      {showTimestamp && formatTimestamp(message.date)}
    </div>

      <ItemPreviewModal 
        show={showModal} 
        onClose={() => setShowModal(false)} 
        item={selectedReport ? { 
          ...selectedReport, 
          userId: selectedReport.userId || "",
          type: "lost"
        } : null} 
      />
        </div>
      </div>

  );
};

export default Convo;
