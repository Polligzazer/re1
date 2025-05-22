import { useContext, useEffect, useRef, useState } from 'react';
import '../css/inquiries.css';
import { AuthContext } from '../components/Authcontext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import ItemPreviewModal from '../components/ItemPreviewModal';
import ClaimPreviewModal from '../components/ClaimPreviewModal';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { db } from '../src/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  senderId: string;
  date: any;
  fileType?: string;
  claimFormRequest?: boolean;
  appealFormRequest?: boolean;
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

interface ClaimItem {
    id: string;
    claimantName: string;
    itemName: string;
    claimedDate: Timestamp;
    userId: string;
    imageUrl?: string;
    status: string;
    category: string;
    description: string;
    location: string;
    date: string;
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
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null);
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
  const fetchSingleClaim = async (id: string) => {
    try {
      const claimDoc = await getDoc(doc(db, 'claim_items', id));
      if (claimDoc.exists()) {
        setSelectedClaim({ id: claimDoc.id, ...claimDoc.data() } as ClaimItem);
        setShowClaimModal(true);
      } else {
        console.warn('Claim report not found');
      }
    } catch (error) {
      console.error('Error fetching claim:', error);
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
                const match = message.text.match(/Report ID:\s*([a-zA-Z0-9]+)/);
                const reportId = match?.[1] || '';
                if (reportId) {
                  handleInquireClick(reportId.trim());
                }
              }}
            >
              Report ID: {message.text.match(/Report ID:\s*([a-zA-Z0-9]+)/)?.[1]}
            </Button>
          </>
        ) : message.text.includes('I want to review this item') ? (
          <>
            <span>I want to review this item</span>
            <Button
              className="btn btn-warning p-1 mt-2"
              style={{ textDecoration: 'none' }}
              onClick={() => {
                const match = message.text.match(/Claim ID:\s*(\S+)/);
                const claimId = match?.[1] || '';
                if (claimId) {
                  fetchSingleClaim(claimId.trim());
                }
              }}
            >
              Claim ID: {message.text.match(/Claim ID:\s*(\S+)/)?.[1] || '[Not Found]'}
            </Button>
            {!currentUser?.isAdmin && (
              <Button
                variant="success-emphasis"
                size="sm"
                className="mt-2"
                onClick={() => {
                  const match = message.text.match(/Claim ID:\s*(\S+)/);
                  const claimId = match?.[1].replace(/[^\w-]/g, '').trim();
                  if (claimId) {
                    alert(`You have requested to appeal Claim ID: ${claimId} again. Please wait for admin response.`);
                    // Optionally, trigger another function here to log/send a follow-up request
                  }
                }}
              >
                Appeal
              </Button>
            )}
          </>
        ) : message.text.includes('Claimed item:') && message.text.includes('Comment:') ? (
        <>
          <span
            style={{
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'Poppins, sans-serif',
              color: '#444',
              marginBottom: '6px',
            }}
          >
           🛠️ Feedback Response:
          </span>
          <p></p>
          <div style={{ marginTop: '4px' }}>
            <p style={{ margin: '4px 0', fontFamily: 'Poppins, sans-serif', fontSize: '13px' }}>
              <strong>Feedback:</strong>{' '}
              {
                message.text.split('\n').find((line) => !line.includes('Claimed item:') && !line.includes('Comment:'))
                || '[No feedback]'
              }
            </p>
          <p></p>    
            <p style={{ margin: '4px 0', fontFamily: 'Poppins, sans-serif', fontSize: '13px' }}>
              <strong>Claimed Item:</strong>{' '}
              {message.text.match(/Claimed item:\s*(.*)/)?.[1] || '[No item name]'}
            </p>

            <p style={{ margin: '4px 0', fontFamily: 'Poppins, sans-serif', fontSize: '13px' }}>
              <strong>Comment:</strong>{' '}
              {message.text.match(/Comment:\s*(.*)/)?.[1] || '[No comment]'}
            </p>
          </div>
        </>
      ) : message.claimFormRequest ? (
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
    )  : message.appealFormRequest ? (
      <>
        <p style={{ fontSize: '12px', marginBottom: '5px' }}>
          ⚠️ This Appeal form is only valid until {formatTimestamp(message.validUntil)}.
          <br /> <br />
          Failing to comply will result in rejection of the request.
          <br /> <br />
          Thank you!
        </p>
        <Link
          to="/report?appealForm=true"
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
          {isExpired ? 'Appeal Form Expired' : 'Complete Appeal Form'}
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
      <ClaimPreviewModal 
        show={showClaimModal} 
        onClose={() => setShowClaimModal(false)} 
        item={selectedClaim}
      />
        </div>
      </div>

  );
};

export default Convo;
