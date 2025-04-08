import React from "react";
import { ID } from "appwrite";
import { apwstorage, APPWRITE_STORAGE_BUCKET_ID } from "../../../src/appwrite";
import fetchUserUID from "../../../components/fetchUserUID";
import { useState, useEffect } from "react";
import { db } from "../../../src/firebase";
import { collection, Timestamp, addDoc, serverTimestamp } from "firebase/firestore";
import ConfirmationModal from "../../../components/ConfirmationModal"; 
import { useNavigate } from "react-router-dom";
import { faFileCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { FaChevronLeft } from "react-icons/fa";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import "../../../css/report.css";
import { Modal} from 'react-bootstrap';  



const Found: React.FC = () => {
  const navigate = useNavigate();

  const categories = [
    "Gadgets",
    "Personal Belongings",
    "School Belongings",
    "Others"
  ];

  const categoryImages: { [key: string]: string } = {
    "Gadgets": "../src/assets/cpIcon.png", 
    "Personal Belongings":  "../src/assets/walletIcon.png",
    "School Belongings":  "../src/assets/notebook (1).png",
    "Others":  "../src/assets/othersIcon.png",
  };

  const [formData, setFormData] = useState({
    item: "",
    category: "",
    description: "",
    location: "",
    date: "",
  });

  const [userUID, setUserUID] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false); 
    const [success, setSucess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true); 
    setShowLoadingModal(true);
    
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
    }finally {
      setLoading(false); 
      setShowLoadingModal(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!userUID) {
      alert("❗ User not authenticated. Please log in again.");
      return;
    }
    setLoading(true); 
    const now = new Date();
    const nineMonthsLater = new Date(now.setMonth(now.getMonth() + 9));
    const validUntil = Timestamp.fromDate(nineMonthsLater);
    
    const reportData = {
      ...formData,
      status: "pendingreport",
      type: "found",
      userId: userUID,
      reportId: `FND-${Date.now()}`,
      timestamp: serverTimestamp(),
      validUntil: validUntil,
      imageUrl: fileUrl || "",
    };

    try {
      await addDoc(collection(db, "lost_items"), reportData);
       setLoading(false);
       setSucess(true);
      
    } catch (error) {
      setLoading(false); 
      setSucess(false); 
      console.error("🔥 Error submitting report:", error);
      alert("❗ Error submitting report. Please try again.");
    } finally{
      setTimeout(() => {
        setSucess(false); 
        setShowModal(false)
        navigate("/report"); 
      }, 2000); 
    }
   
  };

  return (
    <div className="container mt-5">
      {/* Header */}
      <div className="d-flex align-items-center w-100 justify-content-between mt-5 pt-4 mb-3">
      <div className="d-flex flex-column">
        <h1 className="fw-bold" style={{
             fontFamily: "DM Sans, sans-serif", 
             color:"#212020",
             fontSize:"clamp(15px, 5vw, 27px)"
        }}>Report Found Item</h1>
        <p style={{
          fontFamily: "Poppins, sans-serif",
           color:"#454545",
           opacity:"85%",
           fontSize:"clamp(8px, 3vw, 15px)"
        }}>Report found belongings by completing this form</p>
        </div>
        <button 
          className="btn d-flex align-items-center gap-2" 
          onClick={() => navigate("/report")}
          style={{
            fontSize:'clamp(12px, 3vw, 18px)'
          }}
        >
          <FaChevronLeft /> Return
        </button>
      </div>

      {/* Form */}
      <form 
        className=" p-4 row g-4" 
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
                    ? '0px 6px 12px rgba(0, 0, 0, 0.2)' 
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
                <div className="pt-2 px-1" style={{
                  height:'50%',
                  width:'100%',
                  marginTop:'10px',
                  fontSize:"clamp(10px, 1.6vh, 19px)",
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
              <label className="form-label fw-bold">Item Name</label>
              <input
                type="text"
                className="form-control"
                name="item"
                placeholder="Enter item name"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                required
              />
            </div>

            <div className="">
              <label className="form-label fw-bold">Found when</label>
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
            <div className=" d-flex d-lg-none align-self-end" style={{ width: "100%" }}>
 
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
                  className="d-flex flex-row justify-end items-center w-full h-[125.4px] cursor-pointer"
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

                <div className="w-full text-start px-2">
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
        message="Are you sure you want to submit this found item report?"
        loading={loading}
        success={success}
      />
        <Modal show={showLoadingModal} onHide={() => setShowLoadingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{loading ? "Uploading..." : "File Upload Complete"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center flex-column">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Uploading...</span>
              </div>
              <span className="mt-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#2169ac' }}>
                Uploading your file...
              </span>
            </div>
          ) : (
            <div className="d-flex justify-content-center align-items-center flex-column">
              <div className="check-container pb-1">
                <div className="check-background">
                  <svg viewBox="0 0 65 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 25L27.3077 44L58.5 7" stroke="white" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <span className="mt-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#2169ac' }}>
                File uploaded successfully!
              </span>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
    </div>
    
  );
};

export default Found;
