import { useEffect, useState } from "react";
import { db } from "../src/firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { apwstorage, APPWRITE_STORAGE_BUCKET_ID } from "../src/appwrite";
import { ID } from "appwrite";
import "bootstrap/dist/css/bootstrap.min.css";
import { useContext } from "react";
import { AuthContext } from "../components/Authcontext";
import fetchUserUID from "./fetchUserUID";
import "../css/report.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileCirclePlus } from '@fortawesome/free-solid-svg-icons';
import ConfirmationModal from "./ConfirmationModal";

const ClaimFormRequest: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const categories = [
    "Gadgets",
    "Personal Belongings",
    "School Belongings",
    "Others"
  ];

  const categoryImages: { [key: string]: string } = {
    "Gadgets": "../src/assets/cpIcon.png",
    "Personal Belongings":  "../src/assets/walletIcon.png",
    "School Belongings":  "../src/assets/noteIcon.png",
    "Others":  "../src/assets/othersIcon.png",
  };

  const [formData, setFormData] = useState({
    claimantName: "",
    userId: currentUser?.uid || "",
    referencePostId: "",
    itemName: "",
    description: "",
    location: "",
    category: "",
    date: "",
    emailSent: false,
  });

  const [fileName, setFileName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [userUID, setUserUID] = useState<string | null>(null);
  const [isValidReference, setIsValidReference] = useState<boolean | null>(null);
  const [, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false); 
    const [success, setSucess] = useState(false);

  const validateReferenceId = async (id: string) => {
    if (!id) {
      setIsValidReference(null);
      console.log("🟡 Reference ID is empty. Resetting validation.");
      setErrorMessage("");
      return;
    }

    const lostItemRef = doc(db, "lost_items", id);
    const lostItemSnap = await getDoc(lostItemRef);

    if (lostItemSnap.exists()) {
      const lostItemData = lostItemSnap.data();
      // Assuming the type is stored as 'type' field in the lost items collection
      if (lostItemData?.type === "found") {
        setIsValidReference(true);
        setErrorMessage("");
      } else {
        setIsValidReference(false);
        setErrorMessage("The reference ID is not of type 'found'.");
      }
    } else {
      setIsValidReference(false);
      setErrorMessage("No Reference ID found.");
    }
  };
  


  useEffect(() => {
    const getUserUID = async () => {
      const uid = await fetchUserUID();
      if (uid) {
        setUserUID(uid);
      } else {
        console.error("❗ Failed to fetch UID.");
      }
    };

    getUserUID();
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData((prevData) => ({
        ...prevData,
        [name]: value,
    }));

    if (name === "referencePostId") {
        await validateReferenceId(value);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidReference === false || isValidReference === null) {
      alert("❗ Please validate the reference ID before submitting.");
      return;
    }

    setShowModal(true);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const uploadedFile = await apwstorage.createFile(
        APPWRITE_STORAGE_BUCKET_ID, 
        ID.unique(),
        file
      );
  
      const filePreviewUrl = apwstorage.getFilePreview(APPWRITE_STORAGE_BUCKET_ID, uploadedFile.$id);
  
      setFileName(file.name);
      setFileUrl(filePreviewUrl);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("❗ Failed to upload file. Please try again.");
    }
  };
 

  const handleConfirmSubmit = async () => {
    if (!isValidReference) {
      
      alert("❗ Please enter a valid reference ID.");
      return;
    }
    setLoading(true); 
    const claimData = {
      ...formData,
      status: "pendingclaim",
      timestamp: serverTimestamp(),
      imageUrl: fileUrl || "",
      userId: userUID,

    };

    try {
      await addDoc(collection(db, "claim_items"), claimData);
      setLoading(false);
      setSucess(true);
    } catch (error) {
      setLoading(false); 
      setSucess(false); 
      console.error("🔥 Error submitting claim request:", error);
      alert("❗ Error submitting claim request. Please try again.");
    } finally{
      setTimeout(() => {
        setSucess(false); 
        setShowModal(false)
        navigate("/inquiries"); 
      }, 2000); 
    }
  };

  return (
    <div className="container mt-5">

      {/* Form */}
      <form 
        className=" slide-up p-4 row g-4" 
        onSubmit={handleSubmit}
        style={{
          background:'transparent'
        }}
      >
        {/* Category Selection */}
        <div className="d-flex flex-md-row flex-column justify-content-center m-sm-0">
        <div className="btn-size d-flex flex-row" style={{
          width:'90%'
        }}>
          <div className=" d-flex flex-column" style={{
            width:'70%'
          }}>
          <label className="form-label fw-bold ms-1 mb-3"
            style={{
              fontFamily: "DM Sans, sans-serif", 
              fontSize:'clamp(14px, 5vw, 23px)',
              color:'#212020'
            }}
          >Category</label>
          
          <div className=" btn-group gap-3 flex-column flex-sm-row  " role="group"
            style={{
              width:'100%'
            }}
          >
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                style={{
                  borderRadius:'15px',
                  border:'none',
                  backgroundColor: formData.category === category ? '#2169ac': '#dfe8f5',
                  justifyContent:'center',
                  outline:'none',
                  fontFamily:'League Spartan, serif',
                  boxShadow: formData.category === category 
                    ? '0px 6px 12px rgba(0, 0, 0, 0.2)' // **Shadow when selected**
                    : 'none',
                }}
                className="cbtn btn d-flex align-items-md-center align-items-start  flex-row flex-sm-column"
                onClick={() => setFormData({ ...formData, category })}
              >
                <div style={{
                  height:'50%'
                }}>
                <div className="p-2 mt-2" style={{
                  borderRadius:'10px',
                  backgroundColor: formData.category === category ? '#89ccff' : '#2169ac',
                  
                }}>
                <img 
                  src={categoryImages[category]} 
                  alt={category} 
                  style={{ 
                    width: 'clamp(36px, 5vw, 46px)', 
                    backgroundColor:'none', 
                    height: 'clamp(36px, 5vw, 46px)', 
                    objectFit: 'contain' }} 
                />
                </div>
                </div>
                <div className="pt-2" style={{
                  height:'50%',
                  width:'100%',
                  marginTop:'10px',
                  fontSize:"clamp(12px, 1.8vh, 19px)",
                  color:formData.category === category ? '#dfe8f5' : '#2169ac',
                  fontWeight:'bold',
                  lineHeight:'1.2'
                }}>
                {category}
                </div>
              </button>
            ))}
          </div>
          </div>
          <div className=" d-none d-lg-flex flex-row align-self-end" style={{ width: "100%" }}>
 
          <input
            type="file"
            id="fileInput"
            onChange={handleFileChange}
            style={{
              width: 0,
              height: 0,
              opacity: 0,
              overflow: "hidden",
              position: "absolute",
            }}
          />

          <label
            htmlFor="fileInput"
            className="d-flex flex-column justify-end items-center w-full h-[125.4px] cursor-pointer"
            style={{
              padding: "8px 12px",
              backgroundColor: "transparent",
              color: "#2169ac",
              borderRadius: "5px",
            }}
          >
            <FontAwesomeIcon
              icon={faFileCirclePlus}
              style={{
                color: "#2169ac",
                fontSize: "40px",
              }}
            />
            <p className="text-center p-2 pb-0 mb-0">Choose File</p>
          </label>

          <div className="w-full align-self-center text-center px-2">
            {fileName && fileUrl && (
              <a
                href={fileUrl}
                download={fileName}
                style={{ color: "#2169ac", fontSize:'12px', cursor: "pointer", textDecoration: "underline" }}
              >
                {fileName}
              </a>
              
            )}
          </div>
          <button
            onClick={() => {
              setFileName("");
              setFileUrl(null);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              color: "red",
              fontWeight: "bold",
            }}
          >
            Remove file
          </button>
          </div>
        </div>
        

        </div>
        {/* Item Name */}
        <div className="d-flex  flex-column flex-lg-row w-100 justify-content-center">
        <div className="inputfile d-flex flex-md-row gap-4" style={{
          width:'60%',
          paddingLeft:'5%',
          paddingRight:'5%'
        }}>  
        <div className="d-flex flex-column m-0 mt-2" style={{
          width:'100%',       
          rowGap:'40px',
        }}>
            <div className="">
              <label className="form-label fw-bold">Claimant Name</label>
              <input
                type="text"
                className="form-control"
                name="claimantName"
                placeholder={currentUser?.firstName}
                value={formData.claimantName}
                onChange={(e) => setFormData({ ...formData, claimantName: e.target.value })}
              />
            </div>
            <div className="">
              <label className="form-label fw-bold">Item to Claim</label>
              <input
                type="text"
                className="form-control"
                name="itemName"
                placeholder=""
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                required
              />
            </div>

            {/* Date Lost */}
            <div className="">
              <label className="form-label fw-bold">Date Lost</label>
              <input
                type="date"
                className="form-control"
                name="date"
                value={formData.date}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            </div>
          
          <div className="d-flex flex-column" style={{
            width:'100%',
            rowGap:'40px',
          }}>
            {/* Location */}
            <div className="m-0 mt-2" style={{
              width:'100%'
            }}>
              <label className="form-label fw-bold">Location</label>
              <input
                type="text"
                className="form-control"
                name="location"
                placeholder="Enter location details"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
            <div className="m-0" style={{
              width:'100%'
            }}>
              <label className="form-label fw-bold">Reference Post ID</label>
              <input
                type="text"
                className="form-control"
                name="referencePostId"
                placeholder=""
                value={formData.referencePostId}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>
        

        <div className="itemdesc d-flex flex-column "style={{
          width:'30%'
        }}>
        {/* Description */}
        <div className="">
          <label className="form-label fw-bold">Item description</label>
          <textarea
            className="form-controldesc"
            name="description"
            rows={3}
            placeholder="Enter a detailed description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>
        

        {/* Submit Button */}
        <div className=" text-end">
          <button type="submit" className="btn mt-2 w-50 fw-bold py-2"
            style={{
              fontFamily:"Poppins, sans-serif",
              fontSize:'12px',
              color:'white',
              backgroundColor:'#2169ac',
              borderRadius:'15px'
            }}
          >
            Submit
          </button>
        </div>
        </div>
        </div>
      </form>
      <ConfirmationModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirm Submission"
        message="Are you sure you want to submit this claim form?"
        loading={loading}
        success={success}
      />
    </div>
    
  );
};

export default ClaimFormRequest;
