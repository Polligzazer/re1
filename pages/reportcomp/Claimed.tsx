import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../src/firebase";
import { getAuth } from "firebase/auth";

const Claimed = () => {
  const [claimedItems, setClaimedItems] = useState<any[]>([]);
  const auth = getAuth(); // Firebase Auth for current user

  useEffect(() => {
    const fetchClaimedItems = async () => {
      if (!auth.currentUser) return; // Ensure user is authenticated

      try {
        const q = query(
          collection(db, "lost_items"),
          where("userId", "==", auth.currentUser.uid), // User-specific filter
          where("status", "==", "claimed")             // Claimed status filter
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const itemsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setClaimedItems(itemsData);
        } else {
          setClaimedItems([]); // No claimed items found
        }
      } catch (error) {
        console.error("Error fetching claimed items:", error);
      }
    };

    fetchClaimedItems();
  }, [auth.currentUser]); // Re-fetch if user changes

  return (
    <div className="container mt-4">
      {claimedItems.length === 0 ? (
        <p className="alert alert-warning">No claimed items found.</p>
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
