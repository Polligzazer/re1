import { useEffect, useState } from "react";
import { db } from "../src/firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { useContext } from "react";
import { AuthContext } from "../components/Authcontext";

const ClaimFormRequest: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const categories = [
    "Gadgets",
    "Accessories/Personal Belongings",
    "School Belongings",
    "Others"
  ];

  const categoryImages: { [key: string]: string } = {
    "Gadgets": "../src/assets/cpIcon.png",
    "Accessories/Personal Belongings":  "../src/assets/walletIcon.png",
    "School Belongings":  "../src/assets/noteIcon.png",
    "Others":  "../src/assets/othersIcon.png",
  };

  const [formData, setFormData] = useState({
    claimantName: "",
    userId: currentUser?.uid,
    referencePostId: "",
    itemName: "",
    description: "",
    location: "",
    category: "",
    date: ""
  });

  useEffect(() => {
    const fetchClaimantName = async () => {
      if (!currentUser) return;
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const { firstName, lastName } = userSnap.data();
        setFormData((prevData) => ({ ...prevData, claimantName: `${firstName} ${lastName}` }));
      } else {
        console.error("❗ User data not found");
      }
    };

    fetchClaimantName();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const claimData = {
      ...formData,
      status: "pendingclaim",
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "claim_items"), claimData);
      navigate("/home");
    } catch (error) {
      console.error("🔥 Error submitting claim request:", error);
      alert("❗ Error submitting claim request. Please try again.");
    }
  };

  return (
    <div className="container mx-5">
      <h1 className="text-center text-primary">Submit Claim Request</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-4 shadow-lg p-4">
      <div className="col-12">
          <label className="form-label fw-bold">Category</label>
          
          <div className="btn-group w-100 flex-wrap" role="group">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`btn d-flex align-items-center gap-2 ${formData.category === category ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFormData({ ...formData, category })}
              >
                <img 
                  src={categoryImages[category]} 
                  alt={category} 
                  style={{ width: '24px', height: '24px', objectFit: 'contain' }} 
                />
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Claimant Name</label>
          <input
            type="text"
            className="form-control"
            name="claimantName"
            value={formData.claimantName}
            readOnly
          />
        </div>

        <div className="d-flex gap-5">
          <div className="mb-3 col-md-5">
          <label className="form-label">Item to claim</label>
          <input
            type="text"
            className="form-control"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            required
            />
          </div>

          <div className="mb-3 col-md-6">
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-control"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="d-flex gap-5">
          <div className="mb-3 col-md-5">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3 col-md-6">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="form-label">Reference Post ID</label>
          <input
            type="text"
            className="form-control"
            name="referencePostId"
            value={formData.referencePostId}
            onChange={handleChange}
            required
          />
        </div>

        <div className="text-center">
          <button type="submit" className="btn btn-primary w-50">
            Submit Claim
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClaimFormRequest;
