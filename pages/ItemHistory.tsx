import { useState, useEffect } from 'react';
import { db } from '../src/firebase';
import { collection, getDocs, doc, updateDoc, Timestamp, query, where } from 'firebase/firestore';
import { Card } from 'react-bootstrap';

interface Item {
  id: string;
  userId: string;
  username: string;
  referenceId: string;
  type: string;
  date: string;
  location: string;
  description: string;
  item: string;
  status: 'unclaimed' | 'claimed';
  timestamp?: Timestamp;
}

const ItemHistory = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<'unclaimed' | 'claimed'>('unclaimed');
  const [, setUsers] = useState<{ [key: string]: string }>({}); // To store users' names

  useEffect(() => {
    const fetchItemsAndUsers = async () => {
      // Get all users and map them by userId for quick access
      const userSnapshot = await getDocs(collection(db, "users"));
      const usersData = userSnapshot.docs.reduce((acc, userDoc) => {
        const userData = userDoc.data();
        acc[userDoc.id] = `${userData.firstName} ${userData.lastName}`.trim();
        return acc;
      }, {} as { [key: string]: string });
      setUsers(usersData);

      // Query lost items based on filter
      const itemsQuery = query(
        collection(db, "lost_items"),
        where('status', '==', filter)
      );
      const querySnapshot = await getDocs(itemsQuery);
      const fetchedItems = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Item[];

      // Update items with usernames from the pre-fetched users data
      const updatedItems = fetchedItems.map(item => ({
        ...item,
        username: usersData[item.userId] || "Unknown User",
      }));

      // Perform status update if necessary (only if status is 'claimed' and older than 9 months)
      const nineMonthsAgo = new Date();
      nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);
      
      const updates = updatedItems.map(async (item) => {
        if (item.timestamp) {
          const reportDate = item.timestamp.toDate();
          if (reportDate < nineMonthsAgo && item.status !== "unclaimed") {
            const itemRef = doc(db, "lost_items", item.id);
            await updateDoc(itemRef, { status: "unclaimed" });
            item.status = "unclaimed";  // Update the status in the local state
          }
        }
      });

      await Promise.all(updates);
      setItems(updatedItems);
    };

    fetchItemsAndUsers();
  }, [filter]);

  const filteredItems = items.filter((item) =>
    filter === "unclaimed" ? item.status === "unclaimed" : item.status === "claimed"
  );

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center">
        <h2 className="mb-2 fw-bold">Item history</h2>
        <div className="d-flex gap-3 mb-4">
          <div
            className={`fw-bold ${filter === 'unclaimed' ? 'text-primary' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setFilter('unclaimed')}
          >
            Unclaimed
          </div>
          <div
            className={`fw-bold ${filter === 'claimed' ? 'text-primary' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setFilter('claimed')}
          >
            Recovered
          </div>
        </div>
      </div>
      <p className="text-muted mb-4">
        Managing, securing, and maintaining report logs
      </p>

      {filteredItems.map((item) => (
       <div className="d-flex justify-content-center"> 
        <Card key={item.id} className="d-flex item-history-card mb-3 shadow-sm" style={{width:"70%"}} >
          <Card.Body className="item-history-card text-light p-5 d-flex rounded-3" style={{backgroundColor:"#1B75BC"}}>
            <div className="ps-3 pe-4 d-flex align-items-center" 
             style={{
              borderRight:"1px solid white"
             }}>
              <img
                src="../src/assets/walletIcon.png"
                alt="Wallet"
                style={{ width: 'clamp(50px, 10vw, 100px)', minWidth:"20px" }}
              />
            </div>

            <div className="w-100 ms-3" style={{fontSize:"clamp(8px, 2vw, 15px)"}}>
              <div className="fw-bold">{item.item}</div>
              {item.referenceId && <p>Reference Id: {item.id}</p>}
              {item.status === 'claimed' && (
                <div>
                  
                    <strong>Location:</strong> {item.location}
                
                  <p>
                    <strong>Date:</strong> {item.date}
                    <span className="float-end text-light" style={{ wordBreak: 'break-all' }}><br />Post ID: {item.id}</span>
                  </p>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
        </div>
      ))}
    </div>
  );
};

export default ItemHistory;
