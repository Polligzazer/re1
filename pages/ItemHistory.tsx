import { useState, useEffect } from 'react';
import { db } from '../src/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Card } from 'react-bootstrap';

interface Item {
  id: string;
  username: string;
  referenceId?: string;
  schoolId?: string;
  claimedBy?: string;
  dateClaimed?: string;
  role?: string;
  contact?: string;
  itemName: string;
  status: 'none' | 'claimed';
}

const ItemHistory = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<'none' | 'claimed'>('none');

  useEffect(() => {
    const fetchItems = async () => {
      const querySnapshot = await getDocs(collection(db, 'lost_items'));
      const fetchedItems = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Item[];
      setItems(fetchedItems);
    };

    fetchItems();
  }, []);

  const filteredItems = items.filter((item) =>
    filter === 'none'
      ? item.status === 'none'
      : item.status === 'claimed'
  );

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center">
        <h2 className="mb-2 fw-bold">Item history</h2>
        <div className="d-flex gap-3 mb-4">
          <div
            className={`fw-bold ${filter === 'none' ? 'text-primary' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setFilter('none')}
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
                src="/wallet-icon.png" // Sample image placeholder
                alt="Wallet"
                style={{ width: '60px', height: '60px' }}
              />
            </div>

            {/* Right Side */}
            <div className="w-100">
              <div className="fw-bold">@{item.username}</div>
              {item.referenceId && <p>Reference Id: {item.referenceId}</p>}
              {item.schoolId && <p>School Id: {item.schoolId}</p>}

              {/* Claimed Details */}
              {item.status === 'claimed' && (
                <div className="mt-2">
                  <p>
                    <strong>Claimed by:</strong> {item.claimedBy}
                  </p>
                  <p>
                    <strong>Date Claimed:</strong> {item.dateClaimed}
                  </p>
                  <p>
                    <strong>Role:</strong> {item.role}
                  </p>
                  <p>
                    <strong>Contact:</strong> {item.contact}
                  </p>
                </div>
              )}

              {/* Lost Item Info */}
              <p>
                <strong>Lost Item:</strong> {item.itemName}
              </p>
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default ItemHistory;
