import { useState, useEffect, useContext } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../src/firebase";
import { getAuth } from "firebase/auth";
import categoryImages from "../../src/categoryimage";
import { Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFaceTired, faFaceFrown, faFaceGrinBeam, faFaceGrinStars, faSmileBeam } from "@fortawesome/free-regular-svg-icons";
import { handleSend } from "../../chatcomponents/handleSend";
import { useChatContext } from "../../components/ChatContext";
import { AuthContext } from "../../components/Authcontext";
import { useNavigate } from "react-router-dom";



const Claimed = () => {
  const [claimedItems, setClaimedItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [_selectedItem, setSelectedItem] = useState<any>(null);
  const [rating, setRating] = useState<string>("");
  const [selectedFeedback, setSelectedFeedback] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const { currentUser } = useContext(AuthContext);
 const navigate = useNavigate();
  const { dispatch } = useChatContext();
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

  const handleRateClick = (item: any) => {
   setSelectedItem({
      ...item,
      reportId: item.id, 
     });
    setShowModal(true);
    setRating("");
    setComment("");
  };

 const handlefeedback = () => {
    if (!currentUser || !selectedItem) {
      alert("Missing information to send feedback.");
      return;
    }

    const adminUID = "rWU1JksUQzUhGX42FueojcWo9a82";
    const adminUserInfo = { uid: adminUID, name: "Admin" };

    dispatch({ type: "CHANGE_USER", payload: adminUserInfo });

    const combinedId =
      currentUser.uid > adminUID
        ? currentUser.uid + adminUID
        : adminUID + currentUser.uid;

    const fullMessage = `${selectedFeedback}
    Claimed item: ${selectedItem.itemName}
    Comment: ${comment}`;


    handleSend(
      () => {},
      () => {},
      fullMessage,
      { chatId: combinedId, user: adminUserInfo },
      currentUser
    );

    setShowModal(false);
    navigate("/inquiries");
  };



  return (
    <div className="container mt-4">
      {claimedItems.length === 0 ? (
        <p>No claimed items found...</p>
      ) : (
        <div className="row">
          {claimedItems.map((item) => (
            <div key={item.id} className="mb-3 mainclaim " style={{width:"25%"}}>
              <div className="report-card1 p-2 px-1 d-flex flex-column align-items-center">
                    <div className="conimgc d-flex justify-content-center p-2"
                      style={{
                        borderBottom:"1px solid white",
                      }}
                    >
                      <img
                        src={categoryImages[item.category] || "/assets/othersIcon.png"}
                        alt={item.category}
                        className="img-catc"
                      />
                    </div>
                    <div className="detailsc p-2 "
                      style={{
                        fontFamily: "Poppins, sans-serif",
                      }}
                    >         
                    <p className="m-2 p-1"><span className="fw-bold">Claimed item: </span>{item.itemName}</p>
                    <p className="m-2 p-1">
                      <strong>RFID:</strong> {item.referencePostId}
                    </p>
                    <p className="m-2 p-1 mb-0">
                      <strong>Claimed on:</strong> {item.claimedDate}
                    </p>
                  </div>
                  <div className="pb-2" style={{width:'90%'}}>
                     <button className="p-1 px-3" onClick={() => handleRateClick(item)} style={{width:'100%', borderRadius:'5px', backgroundColor:'#67d753', border:'none'}}>Rate</button>
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal style={{ color:'#2169ac',}} show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
        </Modal.Header>
        <Modal.Body className="p-5">
          <p style={{fontSize:'18px', fontFamily:'Work sans, sans-serif'}}><strong>Give feedback</strong></p>
          <p>What do you think about your experience <br/>about this process?</p>
          <div style={{width:'100%'}} className="d-flex flex-column justify-content-between mb-3">
           <div className="d-flex justify-content-between mb-2 flex-row">
              <button
                style={{
                  width:'49%',
                   boxShadow: rating === "awful" ? "0 0 10px 1px #abdbff" : "none",
                   outline: rating === "awful" ? "none" : "1px solid #949da5",
                   color: rating === "awful" ? "white" : "#949da5",
                   backgroundColor: rating === "awful" ? "#2169ac" : "transparent",
                }}
               onClick={(e) => {
                  setRating("awful");               // your existing rating set
                  setSelectedFeedback(e.currentTarget.value);  // save the value from the button here
                }}
                className="btn p-2 justify-content-center align-items-center d-flex flex-row"
                value="My experience about this claim process is awful"
              >
                <FontAwesomeIcon className="fw-bold" icon={faFaceTired}/>
                <p className="ms-1 m-0">Awful</p>
              </button>
              <button
                style={{
                  width:'49%',
                   boxShadow: rating === "sad" ? "0 0 10px 1px #abdbff" : "none",
                   outline: rating === "sad" ? "none" : "1px solid #949da5",
                   color: rating === "sad" ? "white" : "#949da5",
                   backgroundColor: rating === "sad" ? "#2169ac" : "transparent",
                }}
                onClick={(e) => {
                  setRating("sad");               // your existing rating set
                  setSelectedFeedback(e.currentTarget.value);  // save the value from the button here
                }}
                className="btn p-2 justify-content-center align-items-center d-flex flex-row"
                value="I feel sad about this claim process"
              >
                <FontAwesomeIcon className="fw-bold" icon={faFaceFrown}/>
                <p className="ms-1 m-0">Sad</p>
              </button>
            </div>
            <div className="d-flex justify-content-between flex-row mb-2">
              <button
              style={{
                  width:'49%',
                   boxShadow: rating === "good" ? "0 0 10px 1px #abdbff" : "none",
                   outline: rating === "good" ? "none" : "1px solid #949da5",
                   color: rating === "good" ? "white" : "#949da5",
                   backgroundColor: rating === "good" ? "#2169ac" : "transparent",
                }}
                onClick={(e) => {
                  setRating("good");               // your existing rating set
                  setSelectedFeedback(e.currentTarget.value);  // save the value from the button here
                }}
                className="btn p-2 justify-content-center align-items-center d-flex flex-row"
                value="I feel good about this claim process"
              >
                <FontAwesomeIcon className="fw-bold" icon={faSmileBeam}/>
                <p className="ms-1 m-0">Good</p>
              </button>
              <button
                style={{
                  width:'49%',
                   boxShadow: rating === "awesome" ? "0 0 10px 1px #abdbff" : "none",
                   outline: rating === "awesome" ? "none" : "1px solid #949da5",
                   color: rating === "awesome" ? "white" : "#949da5",
                   backgroundColor: rating === "awesome" ? "#2169ac" : "transparent",
                }}
                onClick={(e) => {
                  setRating("awesome");               // your existing rating set
                  setSelectedFeedback(e.currentTarget.value);  // save the value from the button here
                }}
                className="btn p-2 justify-content-center align-items-center d-flex flex-row"
                value="Your claim service was awesome!"
              >
                <FontAwesomeIcon className="fw-bold" icon={faFaceGrinBeam}/>
                <p className="ms-1 m-0">Awesome</p>
              </button>
            </div>
            <button
              style={{
                  width:'100%',
                   boxShadow: rating === "excellent" ? "0 0 10px 1px #abdbff" : "none",
                   outline: rating === "excellent" ? "none" : "1px solid #949da5",
                   color: rating === "excellent" ? "white" : "#949da5",
                   backgroundColor: rating === "excellent" ? "#2169ac" : "transparent",
                }}
                onClick={(e) => {
                  setRating("excellent");               // your existing rating set
                  setSelectedFeedback(e.currentTarget.value);  // save the value from the button here
                }}
                className="btn p-2 justify-content-center align-items-center d-flex flex-row"
                value="Excellent! Your services helps a lot!"
              >
              <FontAwesomeIcon className="fw-bold" icon={faFaceGrinStars}/>
              <p className="ms-1 m-0">Excellent</p>
            </button>
          </div>

          <div className="mb-3">
            <label htmlFor="comment" className="form-label fw-bold" style={{fontFamily:'Work sans, sans-serif'}}>Comment:</label>
            <input
              type="text"
              className="form-control"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment..."
            />
          </div>
       </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-success" onClick={ handlefeedback}>Send</button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Claimed;
