import { useContext, useEffect, useRef, useState } from 'react';
import '../css/inquiries.css';
import { AuthContext } from '../components/Authcontext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import ItemPreviewModal from '../components/ItemPreviewModal';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { db } from '../src/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { APPWRITE_PROJECT_ID, APPWRITE_STORAGE_BUCKET_ID } from "../src/appwrite";

interface Message {
  id: string;
  text: string;
  senderId: string;
  date: any;
  fileType?: string;
  claimFormRequest?: boolean;
  validUntil?: any;
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
  const [reports, setReports] = useState<Report[]>([]);
  const [isExpired, setIsExpired] = useState(false);

  const appwriteProjectId = APPWRITE_PROJECT_ID;
  const appwriteBucketId = APPWRITE_STORAGE_BUCKET_ID;
  const getFileUrl = (fileId: string) => 
    `https://cloud.appwrite.io/v1/storage/buckets/${appwriteBucketId}/files/${fileId}/view?project=${appwriteProjectId}`;

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, [message]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
          const querySnapshot = await getDocs(collection(db, 'lost_items'));
          const fetchedReports = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
          })) as Report[];

          setReports(fetchedReports);
          console.log('Fetched Reports:', fetchedReports);
      } catch (error) {
          console.error('Error fetching reports:', error);
      }
  };

  fetchReports();
}, []);

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
    const matchedReport = reports.find(report => report.id === reportId);
    if (matchedReport) {
      setSelectedReport(matchedReport);
      setShowModal(true);
    }
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
        maxWidth: '300px',
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
              {message.text}
              {message.fileType && (
                <a
                  href={getFileUrl(message.fileType)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    marginTop: '8px',
                    fontSize: '13px',
                    color: '#2169ac',
                    textDecoration: 'underline',
                  }}
                >
                  Attachment file
                </a>
              )}
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
    userId: selectedReport.userId || "", // Default empty string if missing
    type: "lost" // Set a default type if needed
  } : null} 
/>
  </div>
</div>

  );
};

export default Convo;
