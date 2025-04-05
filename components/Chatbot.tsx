import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "../css/Chatbot.css";

import FLO1 from "../src/assets/1bFLO.png";
import FLO2 from "../src/assets/2FLO.png";
import FLO3 from "../src/assets/3FLO.png";
import FLO4 from "../src/assets/4bFLO.png";
import FLO5 from "../src/assets/5FLO.png";

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [messages, setMessages] = useState<{ text: string; sender: string; options?: string[] }[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [userName, setUserName] = useState<string>(""); 
  const [showMainOptionsFlag, setShowMainOptionsFlag] = useState(false);
  const [randomMessage, setRandomMessage] = useState<string>("");

  const chatContainerRef = useRef<HTMLDivElement>(null); 
  const inputRef = useRef<HTMLInputElement>(null); 
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const chatAssistantRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [imageSrc, setImageSrc] = useState(FLO3);
  const chatIconRef = useRef<HTMLButtonElement | null>(null);
  const [hoverMessage, setHoverMessage] = useState("");
  
  
  const PopUPmessages = [
    "Navis is here! How may I help you?",
    "Got a question? Navis is at your service!",
    "Need assistance? Navis is ready to chat!",
    "Hello, I am Navis, nice to meet you!"
  ];

  useEffect(() => {
    let interval;
  
    const updateMessage = () => {
      let newMessage;
      do {
        newMessage = PopUPmessages[Math.floor(Math.random() * PopUPmessages.length)];
      } while (newMessage === randomMessage);
  
      setRandomMessage(newMessage);
      setShowBubble(true);
    };
    updateMessage(); 
    interval = setInterval(updateMessage, 60000); 
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (showBubble) {
      const timeoutId = setTimeout(() => setShowBubble(false), 10000);
      return () => clearTimeout(timeoutId);
    }
  }, [showBubble]);
   
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
       if (user) {
        const fetchUserName = async () => {
        const db = getFirestore();
        const userDoc = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDoc);
    
          if (docSnap.exists()) {
            const userData = docSnap.data();
              setUserName(userData.firstName || "User"); 
          } else {
              console.error("User document not found!");
                setUserName("User");
          }};
          fetchUserName();
       } else {
           console.log("No user is logged in.");
          setUserName("Guest");
        }
    });
     return () => unsubscribe(); 
  }, []);



  useEffect(() => {
    if (isOpen) {
      showMainOptions(); 
    }
  }, [isOpen, userName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatAssistantRef.current && !chatAssistantRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setImageSrc(FLO3);
      }
    };

    const handleResize = () => {
     
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener('resize', handleResize); 

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('resize', handleResize); 
    };
  }, []);

  useEffect(() => {
    setImageSrc(isOpen ? FLO1 : (isHovering ? FLO5 : FLO3));
  }, [isHovering, isOpen]);

  useEffect(() => {
    if (isHovering && !isOpen) {
      const randomIndex = Math.floor(Math.random() * PopUPmessages.length);
      setHoverMessage(PopUPmessages[randomIndex]);
    } else {
      setHoverMessage("");
    }
  }, [isHovering, isOpen]);

  const handleMouseEnter = () => {
    console.log("Mouse enter event triggered"); 
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    console.log("Mouse leave event triggered"); 
    setIsHovering(false);
  };

  const showMainOptions = () => {
    if (!showMainOptionsFlag) {
        setMessages((prev) => [
          ...prev,
          {
            text: `Hi ${userName}, how can I help you?`,
            sender: "bot",
            options: [
              "📌 How to report a lost item",
              "📌 How to report a found item",
              "📌 How to claim an item",
              "📌 Other inquiries",
            ],
          },
        ]);
        setShowMainOptionsFlag(true); 
      }
    };
    
    const handleSendMessage = () => {
      if (userInput.trim() !== "") {
        setMessages([...messages, { text: userInput, sender: "user" }, { text: "Please contact the Admin for more inquiries.", sender: "bot" }]);
        setUserInput(""); 
        if (inputRef.current) {
          inputRef.current.focus(); 
        }
      }
    };
  
    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement | HTMLButtonElement>) => {
      if (event.key === "Enter") {
        handleSendMessage();
      }
    };
    useEffect(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, [messages]);

      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (chatAssistantRef.current && !chatAssistantRef.current.contains(event.target as Node)) {
            setIsOpen(false);
            setImageSrc(FLO3);
          }
        };
    
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }, []); 

  const handleMainSelection = (choice: string) => {
    setShowMainOptionsFlag(false);
    let response = "";
    let subOptions: string[] = [];

    if (choice.includes("📌")) {
  
        setCurrentTopic(choice);
        switch (choice) {
          case "📌 How to report a lost item":
            response = "To report a lost item, please follow these steps:\n\n" + 
                        "1. Find the report page in the side bar\n"+
                        "2. Click Report lost item\n"+
                        "3. Fill up the form\n"+
                        "4. Click submit\n"+
                        "5. Wait for the admin to approve your report\n"+
                        "6. If approved, it will be posted in the home page\n";
            subOptions = ["📋 What details should I include?", "✏️ Can I edit my report?", "🔍 What happens after I report?"];
            break;
          case "📌 How to report a found item":
            response = "To report a found item, please follow these steps:\n\n" + 
                        "1. Find the report page in the side bar\n"+
                        "2. Click Report found item\n"+
                        "3. Fill up the form\n"+
                        "4. Click submit\n"+
                        "5. Surrender the item you've found to the lost and found facility/admission office\n"+
                        "5. Wait for the admin to approve your report\n"+
                        "6. If approved, it will be posted in the home page\n";
            subOptions = ["🙋 Will I remain anonymous?", "📍 Where to leave the item?", "📢 Owner notification process"];
            break;
          case "📌 How to claim an item":
            response = "To claim an item, please follow these steps:\n\n" + 
                        "1. Find the the post of the item that you're trying to claim \n"+
                        "2. Click Inquire us\n"+
                        "3. You will be directed to the Admin inquiries\n"+
                        "4. Admin will verify the claimnant (you) via question and answer\n"+
                        "5. Describe your item and Indicate pictures of proof (if you have)\n"+
                        "6. Admin will send a claim form if he/she verifies you\n"+
                        "7. Fill up the claim form, available only for 30mins\n"+
                        "8. Please include the reference id of the post you inquire about\n"+
                        "9. Submit the form\n"+
                        "10. Admin will double check your form\n"+
                        "11. Admin will send a receipt via email registered to your account\n"+
                        "12. Present it in the Admissions office and formally claim your item\n";
            subOptions = ["📜 Proof required", "⏳ Claiming time limit", "📍 How long does it take to process my claim?"];
            break;
          case "📌 Other inquiries":
            response = "What do you need help with?";
            subOptions = ["🎒 What if my item is not listed?", "📞 Contact support", "📊 Track report status"];
            break;
        }
      } else {
  
        switch (choice) {
          case "📋 What details should I include?":
            response = "Include item description, where you lost it, time lost, and any identifying marks.\n"+
                        "Also indicate a picture of your lost item if youhave one.\n"+
                        "These will help the Admin verify your item quickly if someone posted about it.";
            break;
          case "✏️ Can I edit my report?":
            response = "Unfortunately, not. Please contact the admin for more information";
            break;
          case "🔍 What happens after I report?":
            response = "Your report will be reviewed, will be posted, and the community will be notified about it.";
            break;
          case "🙋 Will I remain anonymous?":
            response = "Yes. Your Security is our priority. Only the Admin has the ability to view the application transparently";
            break;
          case "📍 Where to leave the item?":
            response = "You will first make a report and wait for the admin's instructions. But mostly, it will be dropped off at the admissions office";
            break;
          case "📢 Owner notification process":
            response = "You'll receive a notification if the owner claims it. Otherwise, it will stay untouched and secured at the facility if no one claims it.";
            break;
          case "📜 Proof required":
            response = "The Admin will conduct a question and answer to the claimnant. Please provide a detailed description matching the report you inquire, or send a picture to the Admin as a part of your evidence for claiming the item.";
            break;
          case "⏳ Claiming time limit":
            response = "Found items will be held for 10months or 1 school year before disposal or donation.\n" +
                       "Their respective reports post are stored in item history under unclaimed category ";
            break;
          case "📍 How long does it take to process my claim?":
            response = "Claim processing times vary, but you’ll be notified once the admin has reviewed your request. Keep an eye on your notifications for updates.";
            break;
          case "🎒 What if my item is not listed?":
            response = "If you can't find your lost item in the app, it may not have been reported yet.\n" +
                        " Try checking again later, or message the admin to keep an eye out for it.\n"+
                        "You can also make a report about you lost item to notify the community";
            break;
          case "📞 Contact support":
            response = "You can email **support@floapp.com** or message the admin for more concerns and questions.";
            break;
          case "📊 Track report status":
            response = "Your report status does have its own status depending on what type it is. Just check it in you report page under the pending section.";
            break;
        }
      }
  
      const backButtons = currentTopic
        ? ["🔙 Go back to Options", "🏠 Go back to Main Options"]
        : [];

        setMessages((prev) => [
        ...prev,
        { text: choice, sender: "user" },
        { text: response, sender: "bot", options: [...subOptions, ...backButtons] },
        ]);
     };

     const resetChatbot = () => {
        setMessages([]);
        setCurrentTopic(null);
        setShowMainOptionsFlag(false); 
      };
  return (
    <div ref={chatAssistantRef} className=" fixed bottom-4 right-4 flex flex-col items-end">
     <div className="chat-bubble-container">
      {showBubble && !isOpen && (
       <div 
         className="pop-message shadow-md p-3 rounded-lg mb-3 me-3 flex items-start gap-2"
          style={{
            borderRadius:'30px',
            backgroundColor:'#0f2c53',
            color:'white',
            display: showBubble? 'flex' : 'none'
           }}
        >
          <span className="text-animate">{randomMessage}</span>
        </div>
      )}
      </div>
      {isOpen && (
        <div className="shadow-lg flex flex-col" style={{
            backgroundColor:'#fafcff',
            borderRadius:'10px',
            
        }}>
          <div className="d-flex flex-row p-3 pb-2 items-center mb-2" 
          style={{
            backgroundColor:'#fafcff',
            borderRadius:'10px 10px 0 0',
            borderBottom:'1px solid #0f2c53',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 'bold',
            fontSize: '24.4px',
            color:'#0f2c53'
          }}>
            <img src={FLO4} style={{
                width:"38px",
                height:"38px"
            }}/>
            <p className="ms-2 ">@Navis</p>
            
          </div>

          <div className="overflow-y-auto overflow-x-hidden p-2 rounded messages-scroll"
            style={{
                height:'300px',
                width:'400px'
            }}
           ref={chatContainerRef} >
            {messages.map((msg, index) => (
             <div className={`p-2 ${msg.sender === "user" ? "d-flex justify-content-end " : " d-flex justify-content-start"}`}>   
              <div 
                key={index} 
                className={`p-2  ${msg.sender === "user" ? "text-end " : " text-left"}`} 
                style={{
                    borderRadius:'15px',
                    backgroundColor: msg.sender === "user" ?  '#e3ecf7' : '#e3ecf7',
                }}>
                <pre className="p-1 m-0" style={{
                    width:'auto',
                    maxWidth:'220px',
                    height:'auto',
                    fontFamily:"Work sans, sans-serif",
                    overflowX:'hidden',
                    fontSize:'13px',
                    whiteSpace: 'pre-wrap',
                    
                }}>{msg.text}</pre>
                {msg.options && (
                  <div className="mt-2 flex flex-col" 
                    
                  >
                    {msg.options.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => 
                            option === "🔙 Go back to Options"
                            ? handleMainSelection(currentTopic!)
                            : option === "🏠 Go back to Main Options"
                            ? showMainOptions()
                            : handleMainSelection(option)
                        }
                        className="mt-1 d-flex flex-column p-2 text-sm custom-button"
                        
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              </div>
            ))}
          </div>

          <div className="flex items-center mt-2 p-3" style={{
            borderTop:'1px solid #0f2c53',
          }}>
            <input
              type="text"
              className="flex-1 p-1 px-2 me-2 border-none"
              placeholder="Type a message..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              ref={inputRef}
              style={{
                backgroundColor:'transparent',
                border:'1px solid #0f2c53',
                borderRadius:'15px',
                fontSize:'11.5px',
                color:'black',
                width:'250px',
                fontFamily:"Work sans, sans-serif",
              }}
            />
            <button 
                onClick={() => 
                setMessages([...messages, { text: userInput, sender: "user" }, 
                    { text: "⏳ I'm sorry but I'm still in development. Please contact the Admin for more inquiries.", sender: "bot" }])} 
                className="" 
                style={{
                    backgroundColor:' #0f2c53',
                    color:'white',
                    border:'none',
                    outline:'none',
                    borderRadius:'50%',
                    fontSize:'15px'
                }}
                ref={sendButtonRef} 
                onKeyPress={handleKeyPress} 
                >
              <FontAwesomeIcon icon={faPaperPlane} 
              style={{
                transform: "rotate(30deg)"
              }}/>
            </button>
          </div>
        </div>
      )}
       <div className="chat-bubble-container">
      {hoverMessage && (
          <div 
          className="hover-pop shadow-md p-3 rounded-lg mb-3 me-3 flex items-start gap-2"
          style={{
              borderRadius:'30px',
              backgroundColor:'#0f2c53',
              color:'white'
            }}>  <span className="text-animate">{hoverMessage}</span>
          </div>
        )}
      </div>  
     <div className="d-flex me-2 justify-content-end" >
     
      <button 
        style={{
            backgroundColor:'#0f2c53',
            height:'30px',
            borderRadius:'50%',
            borderColor:'white',
            outline:'none'
        }}
        onClick={() =>{
            if (isOpen) {
                
                resetChatbot(); 
                setImageSrc(FLO3);
              }
              setIsOpen(!isOpen); 
            }} 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            ref={chatIconRef}
        className="icon-btn fixed bottom-4 right-4">
            
        <img src={imageSrc}
             alt="Chatbot" className=""
            style={{
                width:'55px',
                height:'55px',
                position:'relative',
                bottom:'30px',
            }}/>
         
      </button>
      </div>
    </div>
  );
};

export default Chatbot;
