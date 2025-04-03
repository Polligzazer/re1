import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../src/firebase";
import { getAuth } from "firebase/auth";

const Claimed = () => {
  const [claimedItems, setClaimedItems] = useState<any[]>([]);
  const auth = getAuth();

  useEffect(() => {
    const fetchClaimedItems = async () => {
      if (!auth.currentUser) return;

      try {
        const q = query(
          collection(db, "claim_items"),
          where("userId", "==", auth.currentUser.uid),
          where("status", "==", "claimed")       
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const itemsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setClaimedItems(itemsData);
        } else {
          setClaimedItems([]);
        }
      } catch (error) {
        console.error("Error fetching claimed items:", error);
      }
    };

    fetchClaimedItems();
  }, [auth.currentUser]);

  return (
    <div className="container mt-4">
      {claimedItems.length === 0 ? (
        <p>No claimed items found...</p>
      ) : (
        <div className="row">
          {claimedItems.map((item) => (
            <div key={item.id} className="col-md-4 mb-3">
              <div className="card shadow-sm p-3">
                <h5 className="fw-bold">{item.description}</h5>
                <p>
                  <strong>Location:</strong> {item.location}
                </p>
                <p>
                  <strong>Date:</strong> {item.date}
                </p>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt="Claimed item"
                    className="img-fluid rounded"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Claimed;
