import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { useNavigate } from "react-router-dom";
import '../../css/reportfront.css';


const ReportForms: React.FC = () => {
  const navigate = useNavigate();

  return (
    
    <div className="container d-flex flex-row justify-content-center align-items-center mt-5">
      <div className="justify-content-center allign-items-end d-flex flex-row w-100">

      <div className="rbuttons d-flex flex-row w-100 gap-4 justify-content-center align-items-center">
        

        <div className="box-animate mb-3">
          <button
            className="reportbtn btn btn-lg py-3 d-flex flex-column"
            onClick={() => navigate("/report/lost")}
            style={{
              
            }}
          >
          <div className="mdbtn d-flex flex-column flex-md-row">  
            <div className="imgdiv" style={{     
            }}>
              <img className="img" src="../src/assets/cpIcon.png"/>
            </div>
           <span className=" rtext p-4 px-2"> Report <br/>Lost Item </span>
           </div>
           <div className=" d-none d-md-flex divider"style={{
              height:"5%",
              width:"80%",
              borderTop:"1px solid #2169ac",
              alignSelf:"center"
           }}></div>
           <div className="p-3 ms-3 text-start d-none d-md-flex flex-column gap-lg-3" style={{
                fontFamily:"Poppins, sans-serif",
                fontSize:"clamp(9px, 0.9vw, 13px)",
                color:"#2169ac",
                height:'45%'
                
              }}>
             <div className="d-flex flex-row">
                 <FontAwesomeIcon className="pe-2 pt-1" icon={faCircleCheck} />
                 <p>Report your lost belongings</p>
               </div>
              <div className="d-flex flex-row" >
              <FontAwesomeIcon  className="pe-2 pt-1" icon={faCircleCheck} />
              <p>Will be posted in the feed</p>
              </div>
               <div className="d-flex flex-row">
               <FontAwesomeIcon  className="pe-2 pt-1" icon={faCircleCheck} />
               <p className="">Notify the community about your lost belongings</p>
              </div>
              </div>
          </button>
        </div>

        

        <div className="box-animate2 mb-3">
          <button
            className="reportbtn btn btn-lg py-3 d-flex flex-column"
            onClick={() => navigate("/report/found")}
            style={{
            }}
          >
          <div className="mdbtn d-flex flex-column flex-md-row">    
            <div className="imgdiv" style={{     
            }}>
              <img className="img" src="../src/assets/cpIcon.png"/>
            </div>
            
           <span className="rtext p-4 px-2"> Report <br/>Found Item </span>
           </div>
           <div className="d-none d-md-flex divider"style={{
              height:"5%",
              width:"80%",
              borderTop:"1px solid #2169ac",
              alignSelf:"center"
           }}></div>
           <div className="p-3 ms-3 text-start d-none d-md-flex flex-column gap-lg-3" style={{
                fontFamily:"Poppins, sans-serif",
                fontSize:"clamp(9px, 0.9vw, 13px)",
                color:"#2169ac",
                 height:'45%'
                
              }}>
             <div className="d-flex flex-row">
                 <FontAwesomeIcon className="pe-2 pt-1" icon={faCircleCheck} />
                 <p>Report found belongings</p>
               </div>
              <div className="d-flex flex-row" >
              <FontAwesomeIcon  className="pe-2 pt-1" icon={faCircleCheck} />
              <p>Will be posted in the feed</p>
              </div>
               <div className="d-flex flex-row">
               <FontAwesomeIcon  className="pe-2 pt-1" icon={faCircleCheck} />
               <p className="">Notify the community about the item you've found</p>
              </div>
              </div>
          </button>
        </div>

        <div className="ox-animate3 mb-3">
          <button
            className="reportbtn btn btn-lg py-3 d-flex flex-column"
            onClick={() => navigate("/inquiries")}
            style={{
            }}
          >
           <div className="mdbtn d-flex flex-column flex-md-row">    
            <div className="imgdiv" style={{     
            }}>
              <img className="img" src="../src/assets/cpIcon.png"/>
            </div>
           <span className="rtext p-4 px-2"> Claim <br/>Your Item </span>
           </div>
           <div className=" d-none d-md-flex divider"style={{
              height:"5%",
              width:"80%",
              borderTop:"1px solid #2169ac",
              alignSelf:"center"
           }}></div>
           <div className="p-3 ms-3 text-start d-none d-md-flex flex-column gap-lg-3" style={{
                fontFamily:"Poppins, sans-serif",
                fontSize:"clamp(9px, 0.9vw, 13px)",
                color:"#2169ac",
                 height:'45%'
                
              }}>
             <div className="d-flex flex-row">
                 <FontAwesomeIcon className="pe-2 pt-1" icon={faCircleCheck} />
                 <p>Claim your lost belongings</p>
               </div>
              <div className="d-flex flex-row" >
              <FontAwesomeIcon  className="pe-2 pt-1" icon={faCircleCheck} />
              <p>Inquire to the admin</p>
              </div>
               <div className="d-flex flex-row">
               <FontAwesomeIcon  className="pe-2 pt-1" icon={faCircleCheck} />
               <p className="">Verify the item you're trying to claim</p>
              </div>
              </div>
          </button>
        </div>

      </div>
      </div>
    </div>
  );
};

export default ReportForms;
