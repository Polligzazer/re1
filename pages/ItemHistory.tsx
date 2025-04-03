import { useState, useEffect } from 'react';
import { db } from '../src/firebase';
import { collection, getDocs, getDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Card } from 'react-bootstrap';

interface Item {
  id: string;
  userId: string;
  username: string;
  referenceId: string;
  type: string;
  description: string;
  item: string;
  status: 'unclaimed' | 'claimed';
  timestamp?: Timestamp;
}

const ItemHistory = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<'unclaimed' | 'claimed'>('unclaimed');

  useEffect(() => {
    const fetchItems = async () => {
      const querySnapshot = await getDocs(collection(db, "lost_items"));
      const fetchedItems = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Item[];
    
      // Fetch user data for each item
      const updatedItems = await Promise.all(
        fetchedItems.map(async (item) => {
          if (!item.userId) return { ...item, username: "Unknown User" }; // Fallback if userId is missing
    
          const userDoc = await getDoc(doc(db, "users", item.userId));
          if (!userDoc.exists()) return { ...item, username: "Unknown User" };
    
          const userData = userDoc.data();
          return {
            ...item,
            username: `${userData.firstName} ${userData.lastName}`.trim(), // Merge first & last name
          };
        })
      );
      setItems(updatedItems);

      const nineMonthsAgo = new Date();
      nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);

      const updates = fetchedItems.map(async (item) => {
        if (item.timestamp) {
          const reportDate = item.timestamp.toDate();

          // If more than 9 months have passed, mark as "unclaimed"
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

    fetchItems();
  }, []);

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
            🔹 Unclaimed
          </div>
          <div
            className={`fw-bold ${filter === 'claimed' ? 'text-primary' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setFilter('claimed')}
          >
            🔹 Recovered
          </div>
        </div>
      </div>
      <p className="text-muted mb-4">
        Managing, securing, and maintaining report logs
      </p>

      {filteredItems.map((item) => (
        <Card key={item.id} className="mb-3 shadow-sm">
          <Card.Body className="d-flex">
            {/* Left Side */}
            <div className="me-3">
              <img
                src="../src/assets/walletIcon.png"
                alt="Wallet"
                style={{ width: '60px', height: '60px' }}
              />
            </div>

            {/* Right Side */}
            <div className="w-100">
              <div className="fw-bold">{item.item}</div>
              {item.referenceId && <p>Reference Id: {item.referenceId}</p>}

              {/* Claimed Details */}
              {item.status === 'claimed' && (
                <div className="mt-2">
                  <p>
                    <strong>Contact:</strong>
                  </p>
                </div>
              )}

              {/* Lost Item Info */}
              <p>
                <strong>Lost Item:</strong>
              </p>
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default ItemHistory;
