import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../src/firebase";
import { getAuth } from "firebase/auth";
import categoryImages from "../../src/categoryimage";

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
          const itemsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const claimedDate = data.claimedDate?.toDate(); 
            return {
              id: doc.id,
              ...data,
              claimedDate: claimedDate
                ? claimedDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long", 
                    day: "2-digit", 
                  })
                : "Not Available", 
            };
          });
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
              <div className="report-card p-3 d-flex align-items-center">
              <div className="imgreport-div d-flex align-items-center p-2 me-4"
                      style={{
                        borderRight:"1px solid white",
                      }}
                    >
                      <img
                        src={categoryImages[item.category] || "../src/assets/othersIcon.png"}
                        alt={item.category}
                        className="report-image"
                      />
                    </div>
                    <div className="report-infos"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                      }}
                    >         
                    <p><span className="fw-bold">Claimed item: </span>{item.itemName}</p>
                    <p>
                      <strong>RFID:</strong> {item.referencePostId}
                    </p>
                    <p>
                      <strong>Claimed on:</strong> {item.claimedDate}
                    </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Claimed;
