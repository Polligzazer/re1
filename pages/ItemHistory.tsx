import { useState, useEffect, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import { db } from '../src/firebase';
import { collection, getDocs, getDoc, doc, updateDoc, Timestamp, query, where } from 'firebase/firestore';
import { Card } from 'react-bootstrap';
import { faCheckCircle, faCircleCheck, faExclamationTriangle, faHeadset } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import categoryImages from '../src/categoryimage';
import "../css/PendingClaimDash.css";
import { Modal, Button } from "react-bootstrap";
import { AuthContext } from '../components/Authcontext';
import { useChatContext } from "../components/ChatContext";
import { handleSend } from '../chatcomponents/handleSend';

interface Item {
  id: string;
  userId: string;
  username: string;
  referencePostId: string;
  type: string;
  date: string;
  location: string;
  category:string;
  description: string;
  item: string;
  itemName: string;
  status: 'unclaimed' | 'claimed';
  timestamp?: Timestamp;
  validUntil?: Timestamp;
  claimantName?: string; 
  claimedDate?: string | Timestamp; 
  proof?: {
    fileUrl?: string;
    timestamp?: any;
  };
  proofUploadedAt?: any;
  proofOfReturn?: string;
}

const ItemHistory = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<'unclaimed' | 'claimed'>('unclaimed');
  const [, setUsers] = useState<{ [key: string]: string }>({}); 
  const [claimedCount, setClaimedCount] = useState<number>(0);
  const [unclaimedCount, setUnclaimedCount] = useState<number>(0);
  const navigate = useNavigate();
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofUploadedAt, setProofUploadedAt] = useState<any>(null);
  const [proofOfReturn, setProofOfReturn] = useState<string | null>();
  const [, setClaimItems] = useState<Item[]>([]);
  const [lostItems, setLostItems] = useState<Item[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const { currentUser } = useContext(AuthContext);

  const { dispatch } = useChatContext();
  const handleAppeal = async (claimId: string) => {
  if (!currentUser) {
    alert("You must be logged in to inquire.");
    return;
  }

  try {
    const claimRef = doc(db, "claim_items", claimId);
    const claimSnap = await getDoc(claimRef);

    if (!claimSnap.exists()) {
      alert("Claim not found.");
      return;
    }

    const claimData = claimSnap.data();
    const referencePostId = claimData.referencePostId;

    if (!referencePostId) {
      alert("No reference post ID found in this claim.");
      return;
    }

    // Update the status of the claim to "onHold"
    await updateDoc(claimRef, {
      status: "onHold"
    });

    // Update the status of the related lost item to "onHold"
    const lostItemRef = doc(db, "lost_items", referencePostId);
    await updateDoc(lostItemRef, {
      status: "onHold"
    });

    console.log(`Claim ${claimId} and Lost Item ${referencePostId} set to 'onHold'`);

    // Initiate inquiry chat with admin
    const adminUID = "rWU1JksUQzUhGX42FueojcWo9a82";
    const adminUserInfo = { uid: adminUID, name: "Admin" };

    dispatch({ type: "CHANGE_USER", payload: adminUserInfo });

    const combinedId = currentUser.uid > adminUID
      ? currentUser.uid + adminUID
      : adminUID + currentUser.uid;

    handleSend(
      () => {},
      () => {},
      undefined,
      { chatId: combinedId, user: adminUserInfo },
      currentUser,
      claimId,
      'Appeal'
    );

    navigate("/inquiries");
  } catch (error) {
    console.error("Error processing appeal:", error);
    alert("Failed to process the appeal.");
  }
};

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch users
        const userSnapshot = await getDocs(collection(db, "users"));
        const usersData = userSnapshot.docs.reduce((acc, userDoc) => {
          const userData = userDoc.data();
          acc[userDoc.id] = `${userData.firstName} ${userData.lastName}`.trim();
          return acc;
        }, {} as { [key: string]: string });
        setUsers(usersData);

        // Fetch claim_items filtered by status
        const itemsQuery = query(collection(db, "claim_items"), where('status', '==', filter));
        const querySnapshot = await getDocs(itemsQuery);
        const fetchedItems = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Item[];

        // Update counts
        setClaimedCount(fetchedItems.filter(i => i.status === 'claimed').length);
        setUnclaimedCount(fetchedItems.filter(i => i.status === 'unclaimed').length);

        // Attach usernames
        const updatedItems = fetchedItems.map(item => ({
          ...item,
          username: usersData[item.userId] || "Unknown User",
        }));

        // Update statuses for old items (older than 9 months)
        const nineMonthsAgo = new Date();
        nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);

        const updates = updatedItems.map(async (item) => {
          if (item.timestamp) {
            const reportDate = item.timestamp.toDate();
            if (reportDate < nineMonthsAgo && item.status !== "unclaimed") {
              const itemRef = doc(db, "lost_items", item.id);
              await updateDoc(itemRef, { status: "unclaimed" });
              item.status = "unclaimed";
            }
          }
        });
        await Promise.all(updates);

        setItems(updatedItems);

        // Fetch all claim_items and lost_items for proof display
        const [claimSnapshot, lostSnapshot] = await Promise.all([
          getDocs(collection(db, "claim_items")),
          getDocs(collection(db, "lost_items")),
        ]);

        setClaimItems(claimSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Item));
        setLostItems(lostSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Item));

        setItemsLoaded(true);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      }
    };

    fetchAllData();
  }, [filter]);

  const filteredItems = items.filter(item => {
    if (filter === "unclaimed") {
      return item.status === "unclaimed" && item.validUntil && item.validUntil.toDate() < new Date();
    }
    return item.status === "claimed";
  });

  const handleShowProof = (selectedId: string) => {
    console.log("🟡 handleShowProof triggered for ID:", selectedId);

    if (!itemsLoaded) {
      console.warn("⛔ Items not loaded yet.");
      return;
    }

    const claimItem = items.find(item => item.id === selectedId);
    if (!claimItem) {
      console.warn("⛔ Claim item not found with ID:", selectedId);
      return;
    }
    console.log("✅ Found Claim Item:", claimItem);

    const proofObj = claimItem.proof;
    if (!proofObj || (!proofObj.fileUrl && !proofObj.timestamp)) {
      console.warn("⛔ No valid proof object in claim item.");
      return;
    }
    console.log("📎 Claim Item Proof Object:", proofObj);

    const referenceId = claimItem.referencePostId;
    if (!referenceId) {
      console.warn("⛔ No referencePostId found in claim item.");
      return;
    }
    console.log("📌 referencePostId:", referenceId);

    const lostItem = lostItems.find(item => item.id === referenceId);
    if (!lostItem) {
      console.warn("⛔ Lost item not found with referencePostId:", referenceId);
      console.log("🔍 Available lostItem IDs:", lostItems.map(i => i.id));
      return;
    }
    console.log("✅ Found Referenced Lost Item:", lostItem);

    const proofUploadedAtVal = lostItem.proofUploadedAt ?? null;
    const proofOfReturnVal = lostItem.proofOfReturn ?? null;

    console.log("📁 proofUploadedAt:", proofUploadedAtVal);
    console.log("📁 proofOfReturn:", proofOfReturnVal);

    let formattedProofUploadedAt = "";
    if (proofUploadedAtVal) {
      const date =
        typeof proofUploadedAtVal === "object" && proofUploadedAtVal.seconds
          ? new Date(proofUploadedAtVal.seconds * 1000)
          : new Date(proofUploadedAtVal);

      formattedProofUploadedAt = date.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    }

    console.log("🕒 Formatted Proof Uploaded At:", formattedProofUploadedAt);

    setSelectedProof(proofObj.fileUrl || "");
    setProofUploadedAt(formattedProofUploadedAt);
    setProofOfReturn(proofOfReturnVal);
    setShowProofModal(true);
  };

const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return "";

  let dateObj: Date;
  if (typeof timestamp === "object" && timestamp.seconds) {
    dateObj = new Date(timestamp.seconds * 1000);
  } else {
    dateObj = new Date(timestamp);
  }

  return dateObj.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

const getProofUploadDate = (fileUrl: string, items: Item[]): string => {
  const item = items.find((item) => item.proof?.fileUrl === fileUrl);
  if (!item || !item.proof?.timestamp) return "";
  return formatTimestamp(item.proof.timestamp);
};






  return (
    <div className="container mt-5">
      <div className="claim-top-text d-flex" >
      <div className="claim-top-text-text d-flex flex-column">
       <p className="text-start fw-bold m-0 pb-2 mt-5"
        style={{
          fontSize:"24px",
          color:'#212020',
          fontFamily: "DM Sans, sans-serif", 
           
        }}
      >Item history</p>
        <p className="" 
        style={{
          color:'#454545',  
          fontFamily:"Poppins, sans-serif"
        }}>
           Managing, securing, and maintaining report logs
        </p>
      </div>  
      <div className='countdiv'>    
         <div className="number-of-pending d-flex p-2 flex-column pb-4" style={{
            backgroundColor:'#f1f7ff',
            borderRadius:'10px',
            border:'1px solid #bfbdbc',

          }}>
            <div className="d-flex flex-row justify-content-between align-items-center px-4">
              <p className="number-of-pending-text mt-3 m-0 mb-1" style={{
                fontFamily: "DM Sans, sans-serif", 
                fontSize:'25px',
                color:'#0e5cc5',
                padding:'0'
                
              }}>  {filter === 'unclaimed' ? unclaimedCount : claimedCount}</p>
              <FontAwesomeIcon 
               icon={filter === 'unclaimed' ? faExclamationTriangle : faCheckCircle}
                style={{
                  position:'relative',
                  color: filter === 'unclaimed' ? '#e86b70' : '#28a745',
                  fontSize:'29px',
                  top:'-5px'
                }}/>
                
            </div>
            <p className="px-4 text-start" style={{
              color:'#636363',
              fontFamily:"Poppins, sans-serif",
              fontSize:'13.6px'
            }}> {filter === 'unclaimed' ? 'Unclaimed' : 'Recovered Items'}</p>
          </div>
        </div>
      </div>
      <div className='d-flex flex-column mt-4 align-items-center justify-content-center'>
      <div className="r-btn d-flex gap-3 mb-5">
        <div
          className={`radio-btn ${filter === 'unclaimed' ? 'active' : ''}`}
          onClick={() => setFilter('unclaimed')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            fontWeight: 'bold',
          }}
        >
          <div
            className={`radio-circle ${filter === 'unclaimed' ? 'filled' : ''}`}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '2px solid #007bff',
              marginRight: '8px',
              transition: 'background-color 0.3s ease',
              backgroundColor: filter === 'unclaimed' ? '#007bff' : 'transparent',
            }}
          ></div>
          Unclaimed
        </div>
        
        <div
          className={`radio-btn ${filter === 'claimed' ? 'active' : ''}`}
          onClick={() => setFilter('claimed')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            fontWeight: 'bold',
          }}
        >
          <div
            className={`radio-circle ${filter === 'claimed' ? 'filled' : ''}`}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '2px solid #28a745',
              marginRight: '8px',
              transition: 'background-color 0.3s ease',
              backgroundColor: filter === 'claimed' ? '#28a745' : 'transparent',
            }}
          ></div>
          Recovered
        </div>
      </div>
     
      <div className="custom-scrollbar2 d-flex ms-0 align-items-center pb-4 flex-column">
      {filteredItems.map((item) => (
    
        <Card key={item.id}    
        className="d-flex flex-lg-row flex-column align-items-center mb-1 p-0 m-0"
              style={{ backgroundColor: 'transparent', border:"none", color: '#fff', width: "100%",}}>

          <Card.Body className="pending-card align-content-center">
          <div
          onClick={() => {
            if (currentUser?.isAdmin) {
              handleShowProof(item.id);
            }
          }}
           className="card-main d-flex align-items-center p-4"
           style={{
             border:"none", 
             backgroundColor: '#1B75BC', 
             color: '#fff', 
             width: "100%", 
             borderRadius:'6px',
             cursor: currentUser?.isAdmin? 'pointer' : 'default'
             }}>
            <div className="d-flex flex-row fcolumn w-100">
              <div className="conimg d-flex align-items-center justify-content-center "style={{
                  borderRight:'1px solid white'
                  }}>
                <div>
                  <img className="img-cat"
                    src={categoryImages[item.category] || './assets/othersIcon.png'}
                    alt={item.category}/>
                </div>
              </div>

                <div className="details d-flex justify-content-center align-items-start ms-4 flex-column">
                  <p><span className="fw-bold">Claimnant: </span> {item.claimantName || 'N/A'}</p>  
                  <p><span className="fw-bold">Item claimed: </span> {item.itemName || 'Item not available'}</p> 
                  {item.status === 'claimed' && (
                    <div>
                      <p><strong>Date of claimed: </strong> 
                        {item.claimedDate 
                        
                          ? (item.claimedDate instanceof Timestamp 
                            ? new Date(item.claimedDate.seconds * 1000).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })  + ' ' + new Date(item.claimedDate.seconds * 1000).toLocaleTimeString('en-US', {
                              hour: '2-digit', 
                              minute: '2-digit',
                            })
                              : item.claimedDate)
                          : 'Date not available'}
                          
                      </p> 
                  </div>
                )}
              </div>
            </div>
            <div className="card-button d-flex gap-2 align-self-end justify-content-end pt-0" style={{
                width:'22%',
                fontFamily: "Poppins, sans-serif"
              }}>
                <button className="btn" style={{ backgroundColor: "#67d753", width: "50px", height: "30px", color: "white", fontSize: "15.2px", borderRadius: "15px" }} onClick={() => handleAppeal(item.id)}>
                  <FontAwesomeIcon icon={faHeadset} />
                </button>

            </div>
          </div>
          </Card.Body>
        </Card>
        
      ))}
      </div>
      </div>
      <Modal show={showProofModal} onHide={() => setShowProofModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{
          fontSize:'14.4px',
          fontFamily: "Poppins, sans-serif",
          color:'#2169ac'
        }}>Proof Details</Modal.Title>
        </Modal.Header>
         <Modal.Body className="d-flex flex-column flex-lg-row justify-content-evenly"
            style={{
              fontSize:'14px',
              fontFamily: "Poppins, sans-serif",
              width:'100%'
            }}>
              {/* Proof of Return Section */}
              <div className=" p-3 modal-custom1 d-flex flex-column">
                <div className="d-flex p-3 mb-3 flex-row" style={{
                  backgroundColor:'#2169ac',
                  color:'white',
                }}>
                <FontAwesomeIcon icon={faCircleCheck} style={{
                  color:'#67d753',
                  fontSize:'26px'
                  
                }}/>
                  <p className="p-0 m-1">Proof of Return</p>
                </div>
                {proofOfReturn ? (
                   <a href={proofOfReturn} target="_blank" rel="noopener noreferrer">
                    <img
                      src={proofOfReturn}
                      alt="Proof of return"
                      style={{ width: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: '8px', }}
                    />
                   </a> 
                ) : (
                  <p>No proof of return image available.</p>
                )}
                {proofUploadedAt && (
                  <p className="mt-3">
                    <strong>Return Date:</strong> {proofUploadedAt}
                  </p>
                )}
              </div>

              {/* Proof of Claim Section */}
               <div className=" p-3 modal-custom1 d-flex flex-column">
                <div className="d-flex p-3 mb-3 flex-row" style={{
                  backgroundColor:'#2169ac',
                  color:'white',
                }}>
                <FontAwesomeIcon icon={faCircleCheck} style={{
                  color:'#67d753',
                  fontSize:'26px'
                  
                }}/>
                  <p className="p-0 m-1">Proof of Claim</p>
                </div>
                {selectedProof ? (
                   <a href={selectedProof} target="_blank" rel="noopener noreferrer">  
                    <img
                      src={selectedProof}
                      alt="Proof of claim"
                      style={{ width: "100%", maxHeight: "200px", objectFit: "contain",  borderRadius: '8px', }}
                    />
                   </a> 
                ) : (
                  <p>No proof of claim image available.</p>
                )}
                {selectedProof && (
                  <p className="mt-3">
                    <strong>Upload date:</strong> {getProofUploadDate(selectedProof, items)}
                  </p>
                )}
              </div>
            
          </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProofModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default ItemHistory;
