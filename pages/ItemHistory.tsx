import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { db } from '../src/firebase';
import { collection, getDocs, doc, updateDoc, Timestamp, query, where } from 'firebase/firestore';
import { Card } from 'react-bootstrap';
import { faCheckCircle, faExclamationTriangle, faHeadset } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import categoryImages from '../src/categoryimage';
import "../css/PendingClaimDash.css";

interface Item {
  id: string;
  userId: string;
  username: string;
  referenceId: string;
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
}

const ItemHistory = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<'unclaimed' | 'claimed'>('unclaimed');
  const [, setUsers] = useState<{ [key: string]: string }>({}); 
  const [claimedCount, setClaimedCount] = useState<number>(0);
  const [unclaimedCount, setUnclaimedCount] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItemsAndUsers = async () => {
      console.log(`📌 Fetching items with status: '${filter}'`);

      const userSnapshot = await getDocs(collection(db, "users"));
      const usersData = userSnapshot.docs.reduce((acc, userDoc) => {
        const userData = userDoc.data();
        acc[userDoc.id] = `${userData.firstName} ${userData.lastName}`.trim();
        return acc;
      }, {} as { [key: string]: string });
      setUsers(usersData);

  
      const itemsQuery = query(
        collection(db, "claim_items"),
        where('status', '==', filter)
      );
      const querySnapshot = await getDocs(itemsQuery);
      const fetchedItems = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Item[];

      const claimed = fetchedItems.filter(item => item.status === 'claimed').length;
      const unclaimed = fetchedItems.filter(item => item.status === 'unclaimed').length;
      
      setClaimedCount(claimed);
      setUnclaimedCount(unclaimed);

      const updatedItems = fetchedItems.map(item => ({
        ...item,
        username: usersData[item.userId] || "Unknown User",
      }));


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
    };

    fetchItemsAndUsers();
  }, [filter]);

  const filteredItems = items.filter((item) => {
    if (filter === "unclaimed") {
      return (
        item.status === "unclaimed" &&
        item.validUntil &&
        item.validUntil.toDate() < new Date()
      );
    } else {
      return item.status === "claimed";
    }
  });

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
          <div className="card-main d-flex align-items-center p-4"
            style={{ backgroundColor: '#1B75BC', color: '#fff', width: "100%", borderRadius:'6px' }}>
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
                <button className="btn" style={{ backgroundColor: "#67d753", width: "50px", height: "30px", color: "white", fontSize: "15.2px", borderRadius: "15px" }} onClick={() => navigate(`/inquiries`)}>
                  <FontAwesomeIcon icon={faHeadset} />
                </button>

            </div>
          </div>
          </Card.Body>
        </Card>
        
      ))}
      </div>
      </div>
    </div>
  );
};

export default ItemHistory;
