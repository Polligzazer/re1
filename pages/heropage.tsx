import { useNavigate, useLocation } from "react-router-dom";
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import { Autoplay } from 'swiper/modules';
import FLO8 from "/assets/8.png" 
import FLO13 from "/assets/13.png" 
import p1 from "/assets/p1.png" 
import p2 from "/assets/p2.png" 
import p3 from "/assets/p3.png" 
import p4 from "/assets/p4.png" 
import p5 from "/assets/p5.png" 
import p6 from "/assets/p6.png" 
import about1 from "/assets/aboutpic1.png" 
import about2 from "/assets/aboutpic2.png" 
import aboutss from "/assets/aboutbbg.png"
import contactbg from "/assets/imgcontact.png"
import "../css/hero.css"
import {
  faClipboardList,
  faSearchLocation,
  faCamera,
  faComments,
  faBullhorn,
  faArchive,
  faTasks,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";


const HeroPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const fromProfile = location.state?.from === "profile";

    const handleNavigateToLogin = () => {
        navigate("/login");
    };
    const handleNavigateToSignup = () => {
        navigate("/signup");
    };
    const handleNavigateback = () => {
        navigate("/profile");
    };
  return (
    <div className="" style={{height:"auto"}}>
        <div
          className="topbar d-flex px-5 flex-row" 
          style={{
            position:"sticky", 
            width:"100%",
            top:'0',
            zIndex:'3',
            backgroundColor:'#fafcff',
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)", 
            }}> 
            <div className="logoimg p-4 px-5"
             style={{
                width:'30%'
             }}
            >
                <img 
                 src="/assets/FLOLOGObg.png"
                 style={{
                    height:'50px'
                 }}
                 />
            </div>
            <div className="optionsbutton d-flex gap-3 justify-content-end p-4 px-5"
              style={{
                width:'70%',
                fontFamily:'Work sans, sans serif',
                color:'#0e5cc5',
                fontSize:'13.9px',
               
            }}
            >
                 {!fromProfile && (
                    <>
                        <button 
                            onClick={handleNavigateToLogin}
                            style={{
                                backgroundColor: 'transparent',
                                outline: 'none',
                                border: 'none',
                                color: '#0e5cc5',
                                fontSize: '13.9px'
                            }}
                        >
                            Login
                        </button>
                    </>
                )}

                {fromProfile && (
                    <button
                        onClick={handleNavigateback}
                        style={{
                            backgroundColor: '#0e5cc5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            fontSize: '13.9px',
                            marginLeft: '20px'
                        }}
                    >
                        Back to Profile
                    </button>
                )}
            </div>
        </div>
        <div
            className="ps-lg-5 justify-content-center align-items-center section1 d-flex flex-row" >
            <motion.div 
                className=" section1-text d-flex ms-5 p-5 flex-column"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <p 
                    style={{
                        fontFamily:'DM sans, sans-serif',
                        color:'#2c6dc2',
                        fontSize:'clamp(26px, 3vw, 46px)',
                        fontWeight:'bold',
                        
                    }}
                >Lost and Found 
                <br/>made transparent</p>
                <p 
                    className="" 
                    style={{
                        width:'70%',
                        color:'#2c6dc2',
                        fontFamily:'DM sans, sans-serif',
                        fontSize:'clamp(10px, 1vw, 15px)'
                    }}>
                Reporting and retrieving lost belongings secure, simpler, faster, and more transparent than ever.</p>
                <motion.button
                    onClick={handleNavigateToSignup}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2"
                    style={{
                        border:'none',
                        outline:'none',
                        backgroundColor:'#fafcff',
                        borderRadius:'30px',
                        width:'12vw',
                        minWidth:'100px',
                        color:'#004aad',
                        fontSize:'clamp(8px, 1vw, 16px',
                        boxShadow: '0 -8px 8px -4px #7cc5fd, 0 8px 8px -4px #7cc5fd' 
                    }}
                > Get Started</motion.button>
            </motion.div>
            <motion.div 
                className='circlediv'
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{position:'relative', width:'40%'}}>
                <motion.div 
                    className="c1"
                    style={{
                        position:'absolute',
                        right:'12vw',
                        top:'-15vw',
                        borderRadius:'50%',
                        height:'16vw',
                        width:'16vw',
                        minHeight:'', 
                        background: 'linear-gradient(180deg, #bdf3ff, #1e60bb)',                       
                    }}
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                >
                </motion.div>
                <motion.div 
                    className="c2"
                    style={{
                        position:'absolute',
                        left:'-1.5vw',
                        top:'-3.5vw',
                        borderRadius:'50%',
                        height:'12vw',
                        width:'12vw',
                        minHeight:'', 
                        background: 'linear-gradient(180deg, #bdf3ff, #1e60bb)',  
                    }}
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >

                </motion.div>
                <motion.div 
                    className="c3"
                    style={{
                        position:'absolute',
                        left:'9vw',
                        top:'6vw',
                        borderRadius:'50%',
                        height:'9vw',
                        width:'9vw',
                        minHeight:'', 
                        background: 'linear-gradient(180deg, #bdf3ff, #1e60bb)',  
                    }}
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}    
                >
                </motion.div>
            </motion.div>
        </div>
        <div
            className=" section2 d-flex flex-row p-5">
            <motion.div
                className="vision"
                style={{
                    width:'60%'
                }}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="navisdivs1 mx-4 m-0 d-flex align-items-center">
                    <div 
                        className="circlenavis1">
                        <img
                            src={FLO8}
                            className="navis1"
                            style={{
                                
                            }}
                        />
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="visiontextdiv mx-5">
                    <p className="fw-bold visiontitle">Our Vision</p>
                    <p 
                        style={{
                            fontFamily:'DM sans, sans-serif',
                            color:'#004097',
                            fontSize:' clamp(12px, 2vw, 19px)'
                        }}>
                    We envision a community where lost belongings don’t stay lost for long—a place where technology bridges the gap between people and their misplaced 
                    items. Our Lost and Found web application is built to streamline and modernize the recovery process, transforming confusion into clarity and disconnection into reconnection.
                    </p>                   
                </motion.div>
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '70%' }}
                    transition={{ duration: 1, delay: 0.8 }}
                    viewport={{ once: true }}
                    className=""
                    style={{
                        borderTop:'2px solid #ffd991',
                        width:'70%',
                        height:'10%'
                    }}
                    >
                </motion.div>
            </motion.div>
            <motion.div
                 initial={{ opacity: 0, x: 50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.8, ease: "easeOut" }}
                 viewport={{ once: true }}
                className=" buildingdiv d-flex justify-content-center align-items-center me-5">
                <img
                    src={about1}
                    style={{
                        height:'30vw'
                    }}
                />
            </motion.div>
        </div>
        <div
            className=" section3 border d-flex flex-row p-5">
            <motion.div
                 initial={{ opacity: 0, x: -50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.8, ease: "easeOut" }}
                 viewport={{ once: true }}
                className="thingdiv d-flex justify-content-center align-items-center ms-5">
                <img
                    src={about2}
                    style={{
                        height:'30vw'
                    }}
                />
            </motion.div>
            <motion.div
                 initial={{ opacity: 0, x: 50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.8, ease: "easeOut" }}
                 viewport={{ once: true }}
                className="mission me-5">
                <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 1, delay: 0.3 }}
                      viewport={{ once: true }}
                    className="navisdivs2 mx-4 m-0 d-flex justify-content-end align-items-center" >
                    <div 
                        className="circlenavis2">
                        <img
                            className="navis2"
                            src={FLO13}/>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="missiondivtext mx-5">
                    <p 
                        className="missiontitle fw-bold"
                        style={{
                            fontFamily:'DM sans, sans-serif',
                            color:'#004097',
                        }}>Our Mission</p>
                    <p 
                        style={{
                            fontFamily:'DM sans, sans-serif',
                            color:'#004097',
                             fontSize:' clamp(12px, 2vw, 19px)'
                        }}>
                    Our mission is to provide a secure, intuitive, and user-friendly platform that 
                    simplifies how individuals report, search for, and claim lost items. 
                    By centralizing info p-4rmation and offering accessible tools, we aim to reduce the time, stress,
                    and uncertainty that often come with losing something valuable.                   
                    </p>                   
                </motion.div>
                <motion.div
                     initial={{ width: 0 }}
                     whileInView={{ width: '70%' }}
                     transition={{ duration: 1, delay: 0.8 }}
                     viewport={{ once: true }}
                    className=""
                    style={{
                        borderTop:'2px solid #ffd991',
                        width:'70%',
                        height:'10%'
                    }}
                    >
                </motion.div>
            </motion.div>
            
        </div>
        <div
            className="justify-content-center align-items-center section4 d-flex flex-column">   
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                viewport={{ once: true }}
                className="d-flex text-center justify-content-center align-items-center flex-column"
                style={{
                    width:'100%',
                    height:'50%',
                    fontFamily:'DM sans, sans-serif',
                    color:'#004097',
                }}
            >
                <p
                    style={{
                        fontSize:'clamp(25px, 3vw, 35px)'
                    }}
                >Features</p>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="featurestext">
                Discover powerful tools designed to make reporting, 
                searching, and claiming lost items fast, secure,
                 and hassle-free. FLO is built for ease, transparency, and real results.</motion.p>
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
                viewport={{ once: true }}
                className=""
                style={{
                    height:'50%',
                    width:'100%',
                    overflow:'hidden',
                    fontFamily:'DM sans, sans-serif',
                    color:'#004097',
                }}
            >
                <Swiper
                    grabCursor={true}
                    centeredSlides={true}
                    slidesPerView={5}
                    spaceBetween={30} 
                    loop={true}
                    autoplay={{ delay: 2500, disableOnInteraction: false }}
                    modules={[Autoplay]}
                    className=" py-2 feature-carousel"
                    style={{
                        overflow:'hidden'
                    }}
                    breakpoints={{
                        0: { slidesPerView: 1 },
                        576: { slidesPerView: 3 },
                        768: { slidesPerView: 3 },
                        991: {slidesPerView: 5}
                      }}
                    >
                    <SwiperSlide className="slide slides p-4 text-center">
                        <div className="icondiv">
                            <FontAwesomeIcon icon={faClipboardList} className="icon" />
                        </div>
                        <p>Report lost and found item</p>
                        <div className="line"></div>
                    </SwiperSlide>

                    <SwiperSlide className="slide slides p-4 text-center">
                        <div className="icondiv">
                            <FontAwesomeIcon icon={faSearchLocation} className="icon" />
                        </div>
                        <p>Claim your lost belongings</p>
                        <div className="line"></div>
                    </SwiperSlide>

                    <SwiperSlide className="slide slides p-4 text-center">
                        <div className="icondiv">
                            <FontAwesomeIcon icon={faCamera} className="icon" />
                        </div>
                        <p>Submit your reports with images</p>
                        <div className="line"></div>
                    </SwiperSlide>

                    <SwiperSlide className="slide slides p-4 text-center">
                        <div className="icondiv">
                            <FontAwesomeIcon icon={faComments} className="icon" />
                        </div>
                        <p>Inquire and message the admin in realtime</p>
                        <div className="line"></div>
                    </SwiperSlide>

                    <SwiperSlide className="slide slides p-4 text-center">
                        <div className="icondiv"> 
                            <FontAwesomeIcon icon={faBullhorn} className="icon" />
                        </div>
                        <p>Notify and alert the community about your report</p>
                        <div className="line"></div>
                    </SwiperSlide>

                    <SwiperSlide className="slide slides p-4 text-center">
                        <div className="icondiv"> 
                            <FontAwesomeIcon icon={faArchive} className="icon" />
                        </div>    
                        <p>Store claimed reports in history</p>
                        <div className="line"></div>
                    </SwiperSlide>

                    <SwiperSlide className="slide slides p-4 text-center">
                        <div className="icondiv">
                            <FontAwesomeIcon icon={faTasks} className="icon" />
                        </div>
                        <p>Track pending report status in realtime</p>
                        <div className="line"></div>
                    </SwiperSlide>
                </Swiper>
            </motion.div>  
        </div>
        <div
            className="d-flex justify-content-end align-items-center"
            style={{
                backgroundImage:`url(${aboutss})`,
                height:'15vw',
                minHeight:'100px',
                backgroundSize:'cover',
                backgroundRepeat:'no-repeat',
                backgroundPosition:' center center',
                color:'white',
                fontFamily:'Work sans, sans-serif',
                fontSize:'18px' 
            }}
        >
           <motion.p 
                style={{ width: '50%', fontSize: 'clamp(12px, 1.5vw, 18px)' }} 
                className="px-5 secdesc text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
            >
                Your data is securely handled, ensuring safe and trustworthy exchanges within the community.
            </motion.p>
          </div>    
        <div
            className="border mt-3 justify-content-center align-items-center section5 d-flex flex-column"> 
            <div
                className="peopletitle d-flex text-center justify-content-center align-items-center flex-column">
                <motion.p
                    style={{
                        fontSize: 'clamp(25px, 3vw, 35px)',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    viewport={{ once: true }}
                >
                    We are the people behind FLO
                </motion.p>
                <motion.p
                    className="peopledesc"
                    style={{
                        width: '50%',
                        fontFamily: 'Work sans, sans-serif',
                        fontSize: 'clamp(12px, 1.5vw, 18px)',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    viewport={{ once: true }}
                >
                    Discover powerful tools designed to make reporting, searching, and claiming lost items fast, secure,
                    and hassle-free. FLO is built for ease, transparency, and real results.
                </motion.p>
            </div>
            <motion.div
                className="peoplesdiv d-flex gap-5 justify-content-center align-items-center flex-row"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                viewport={{ once: true }}
            >
                <div className="twodiv flex-column d-flex gap-5">
                    <motion.div className="person1" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}>
                        <div className="personpic">
                            <img className="p6" src={p6} />
                        </div>
                        <div className="info p-4">
                            <p className="mb-0 name">John Christian Lomotan</p>
                            <p className="position">General Manager</p>
                        </div>
                    </motion.div>
                    
                    <motion.div className="person4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.7 }}>
                        <div className="personpic">
                            <img className="p2" src={p2} />
                        </div>
                        <div className="info p-4">
                            <p className="mb-0 name">Rain Andrei Aquino</p>
                            <p className="position">Customer Support</p>
                        </div>
                    </motion.div>
                </div>
                
                <div className="twodiv flex-column d-flex gap-5">
                    <motion.div className="person2" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.8 }}>
                        <div className="personpic">
                            <img className="p1" src={p1} />
                        </div>
                        <div className="info p-4">
                            <p className="mb-0 name">Aezekiel Matthew Licardo</p>
                            <p className="position">Technical Manager</p>
                        </div>
                    </motion.div>

                    <motion.div className="person3" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.9 }}>
                        <div className="personpic">
                            <img className="p4" src={p4} />
                        </div>
                        <div className="info p-4">
                            <p className="mb-0 name">Sam Gabriel Arias</p>
                            <p className="position">Operational Manager</p>
                        </div>
                    </motion.div>
                </div>
                
                <div className="twodiv flex-column d-flex gap-5">
                    <motion.div className="person5" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1 }}>
                        <div className="personpic">
                            <img className="p5" src={p5} />
                        </div>
                        <div className="info p-4">
                            <p className="mb-0 name">Justin Cloud Tomaquin</p>
                            <p className="position">Finance Manager</p>
                        </div>
                    </motion.div>

                    <motion.div className="person6" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.1 }}>
                        <div className="personpic">
                            <img className="p3" src={p3} />
                        </div>
                        <div className="info p-4">
                            <p className="mb-0 name">Aug John Lie Mosende</p>
                            <p className="position">Legal support</p>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>  
        <div
            className="lastsection justify-content-center align-items-center d-flex flex-row"
            style={{
                height:'40vw', 
                minHeight:'500px',
                backgroundColor:'white'
           }}> 
           <motion.div
                className="formsdiv d-flex justify-content-end"
                style={{
                    width: '50%',
                }}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
            >
                <div
                    className="divsecondforms"
                    style={{
                        width: '80%',
                    }}
                >
                    <p
                        style={{
                            fontFamily: 'DM sans, sans-serif',
                            fontSize: 'clamp(12px, 1.5vw, 26px)',
                        }}
                    >
                        For more questions, inquiries, and suggestions
                    </p>
                    <form className="emailform d-flex flex-column">
                        <input className="my-2" type="text" placeholder="Name" />
                        <input className="my-2" type="email" placeholder="Email" required />
                        <label className="mt-2 labelm">Message</label>
                        <textarea
                            required
                            className="message my-2"
                            rows={4}
                            placeholder="Enter your message"
                        />
                        <button className="submit p-2 my-2">Submit</button>
                    </form>
                </div>
            </motion.div>
            <motion.div
                className="imgcontact d-flex justify-content-center"
                style={{
                    width: '40%',
                }}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
            >
                <img
                    src={contactbg}
                    style={{
                        width: '80%',
                    }}
                />
            </motion.div>
        </div>  
        <div
            style={{height:'1vw'}}
        ></div>    
    </div>
  );
};

export default HeroPage;