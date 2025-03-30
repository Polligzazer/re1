import "bootstrap-icons/font/bootstrap-icons.css";
import "../css/aboutus.css"
import "bootstrap/dist/css/bootstrap.min.css";
import { NavLink } from "react-router-dom";


const Aboutus = () => {



    return (
        <div style={{ overflowX: "hidden" }}>
            <nav className="navbar navbar-expand ps-lg-4 fixed-top"
                style={{
                    height: "10vh",
                    backgroundColor: "#fafcff",
                    borderBottom: "1.5px solid #dfe8f5"
                }}>
                <ul className="navbar-nav">
                    <li className="d-flex">
                        <img
                            className="bg-transparent d-none d-sm-flex ms-5"
                            src="../../src/assets/FLOLOGObg.png"
                            style={{
                                width: "6vw",
                                minWidth: "100px",
                                height: "auto",
                                padding: "0px",
                                marginBottom: "1rem",
                                marginTop: "0.8rem",
                            }}
                            alt="FLO Logo"
                        />
                    </li>
                </ul>

                <div className="d-flex justify-content-end flex-grow-1 me-5">
                    <ul className="navbar-nav align-items-center ms-auto">
                        <li className="nav-item fs-4 ps-xl-4 pe-xl-4">
                            <NavLink to="/home" className="nav-link">
                                <span className="d-none d-md-inline pe-2">Home</span>
                            </NavLink>
                        </li>
                        <li className="nav-item fs-4 ps-xl-4 pe-xl-4">
                            <NavLink to="/aboutus" className="nav-link">
                                <span className="d-none d-md-inline pe-2 text-primary">About us</span>
                            </NavLink>
                        </li>
                        <li className="nav-item fs-4 ps-xl-4 pe-xl-4">
                            <NavLink to="/" className="nav-link">
                                <span className="d-none d-md-inline pe-2">Sign-in</span>
                            </NavLink>
                        </li>
                    </ul>
                </div>
            </nav >

            <div className="d-flex w-100 justify-content-center align-items-center"
                style={{
                    backgroundColor: "#142343",
                    marginTop: "150px"

                }}>
                <span className="d-flex justify-content-center "
                    style={{
                        fontSize: "clamp(15px, 4vw, 50px)",
                        color: "white",
                        borderLeft: "3px solid white",
                        padding: "50px",
                        margin: "40px",
                        marginRight: "120px",
                        marginLeft: "60px",
                        fontFamily: "Work Sans, sans-serif",
                    }}>ABOUT <br /> US</span>
                <div className="aboutwallet d-flex justify-content-end pt-4 pb-4 pe-sm-0 pe-md-5 pe-sm-5" style={{ position: "relative" }}>
                    <img src="../../src/assets/aboutwallet.png" alt="wallet" className="walletabout"
                        style={{
                            width: "clamp(400px, 50vw, 600px)",
                            minWidth: "100px",
                            maxWidth: "600px",
                            height: "auto",
                            marginTop: "10px",
                            marginRight: "10px",
                            padding: "18px",
                            marginLeft: "10%"
                        }} />
                </div>
            </div>
            <div className="abouttext d-flex p-5 fs-5 justify-content-center align-items-center">
                <span className="textleft ps-md-5 ps-sm-0 pe-sm-5" id="text1"
                    style={{
                        paddingLeft: "200px",
                        fontSize: "clamp(12px, 2vw, 30px)",
                        paddingRight: "100px",
                        textAlign: 'center',
                        fontFamily: "Work Sans, sans-serif",
                    }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </span>
                <img src="../../src/assets/Magnifying.png" alt="" className="imgright me-sm-0" id="img1"
                    style={{
                        width: "12vw",
                        minWidth: "12%",
                        height: "auto",
                        marginRight: "100px"
                    }} />
            </div>

            <div className="abouttext d-flex p-5 fs-5 justify-content-center align-items-center"
                style={{
                    backgroundColor: "#142343"
                }}>
                <span className="textleft ps-md-5 ps-sm-5 pe-sm-5" id="text2" style={{
                    color: "white",
                    fontSize: "clamp(12px, 2vw, 30px)",
                    paddingLeft: "200px",
                    paddingRight: "100px",
                    textAlign: 'center',
                    fontFamily: "Work Sans, sans-serif"
                }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </span>
                <img src="../../src/assets/Robot.png" alt="" className="imgright me-sm-0" id="img2"
                    style={{
                        width: "12vw",
                        minWidth: "12%",
                        height: "auto",
                        marginRight: "100px"
                    }} />
            </div>

            <div className="abouttext d-flex p-5 ms-3 me-3 fs-4 mt-3 justify-content-center align-items-center" style={{ boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.2)" }}>
                <div className="d-flex flex-column align-items-center me-4 me-sm-0 me-lg-5" >
                    <img src="../../src/assets/reportIcon.png" alt="" className="imgleft ms-md-5 ms-sm-0 me-sm-2" id="img3"
                        style={{
                            width: "10vw",
                            minWidth: "12%",
                            height: "auto",
                            marginLeft: "75px"
                        }} />

                    <span className="imgleft text-center fw-bold ms-md-5 ms-sm-0 me-sm-2" id="img3"
                        style={{
                            color: "#2169ac",
                            fontSize: "clamp(13px, 2vw, 40px)",
                            marginLeft: "120px",
                            fontFamily: "Work Sans, sans-serif",
                        }}> Report <br /> Lost Item
                    </span>

                </div>
                <span className="textright ms-3 ps-md-4 pb-3  pe-md-6 ps-sm-0 pe-sm-0 ps-sm-2" id="text3"
                    style={{
                        color: "#2169ac",
                        fontSize: "clamp(12px, 2vw, 30px)",
                        paddingTop: "30px",
                        paddingLeft: "50.3px",
                        paddingRight: "100px",
                        textAlign: "center",
                        fontFamily: "Work Sans, sans-serif"
                    }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </span>
            </div>

            <div className="abouttext d-flex p-5 ms-3 me-3 fs-4 mt-3 justify-content-center align-items-center" style={{ boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.2)" }}>
                <span className="textleft ps-md-s pe-md-5 pb-3  ps-sm-0 pe-sm-0 pe-sm-3" id="text4"
                    style={{
                        color: "#2169ac",
                        fontSize: "clamp(12px, 2vw, 30px)",
                        paddingTop: "30px",
                        paddingLeft: "100px",
                        paddingRight: "120px",
                        textAlign: "center",
                        fontFamily: "Work Sans, sans-serif"
                    }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </span>

                <div className="d-flex flex-column align-items-center me-4 me-sm-0 me-lg-5">
                    <img src="../../src/assets/reportIcon.png" alt="" className="imgright2 me-md-5 me-sm-0 ms-sm-2" id="img4"
                        style={{
                            width: "10vw",
                            minWidth: "12%",
                            height: "auto",
                            marginRight: "100px"
                        }} />

                    <span className="imgright2 text-center fw-bold me-md-5 me-sm-0 ms-sm-2" id="img4"
                        style={{
                            color: "#2169ac",
                            fontSize: "clamp(13px, 2vw, 40px)",
                            marginRight: "100px",
                            fontFamily: "Work Sans, sans-serif",
                        }}> Report <br /> Found Item
                    </span>
                </div>
            </div>

            <div className="abouttext d-flex p-5  ms-3 me-3 fs-4 mt-3 justify-content-center align-items-center" style={{ boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.2)" }}>
                <div className="d-flex flex-column align-items-center me-4 me-sm-0 me-lg-5">
                    <img src="../../src/assets/claimbox.png" alt="" className="imgleft ms-md-5 ms-sm-0 me-sm-2" id="img5"
                        style={{
                            width: "10vw",
                            minWidth: "12%",
                            height: "auto",
                            marginLeft: "75px"
                        }} />

                    <span className="imgleft text-center fw-bold ms-md-5 ms-sm-0 me-sm-2" id="img6"
                        style={{
                            color: "#2169ac",
                            fontSize: "clamp(13px, 2vw, 40px)",
                            marginLeft: "75px",
                            fontFamily: "Work Sans, sans-serif",
                        }}> Claim an <br /> Item
                    </span>

                </div>
                <span className="textright ms-3 ps-md-4 pb-3  pe-md-6 ps-sm-0 pe-sm-0 ps-sm-2" id="text5"
                    style={{
                        color: "#2169ac",
                        fontSize: "clamp(12px, 2vw, 30px)",
                        paddingTop: "30px",
                        paddingLeft: "50.3px",
                        paddingRight: "100px",
                        textAlign: "center",
                        fontFamily: "Work Sans, sans-serif"
                    }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </span>
            </div>

            <div className="abouttext d-flex p-5 ms-3 me-3 mt-3 justify-content-center align-items-center" style={{ boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.2)" }}>
                <span className="textleft ps-md-5 pe-md-5 pb-3  ps-sm-0 pe-sm-0 pe-sm-3" id="text6"
                    style={{
                        color: "#2169ac",
                        fontSize: "clamp(12px, 2vw, 30px)",
                        paddingTop: "30px",
                        paddingLeft: "100px",
                        paddingRight: "120px",
                        textAlign: "center",
                        fontFamily: "Work Sans, sans-serif"
                    }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </span>

                <div className="d-flex fs-4 flex-column align-items-center me-4 me-sm-0 me-lg-5">
                    <img src="../../src/assets/mailicon.png" alt="" className="imgright2 me-md-5 me-sm-0 ms-sm-2" id="img6"
                        style={{
                            width: "10vw",
                            minWidth: "12%",
                            height: "auto",
                            marginRight: "100px"
                        }} />

                    <span className="imgright2 text-center fw-bold me-md-5 me-sm-0 ms-sm-2" id="img6"
                        style={{
                            color: "#2169ac",
                            fontSize: "clamp(13px, 2vw, 40px)",
                            marginRight: "100px",
                        }}> Inquire <br /> the Admin
                    </span>
                </div>
            </div>

            <div className="abouttext d-flex flex-column align-items-center pt-5">
                <span className="pb-2 fw-bold"
                    style={{
                        color: "#0e5cc5",
                        fontSize: "clamp(19px, 3vw, 50px)",
                        fontFamily: "Work Sans, sans-serif",
                    }}>Our Team</span>

                <span className="text-center"
                    style={{
                        color: "#0e5cc5",
                        fontSize: "clamp(13px, 2vw, 40px)",
                        paddingLeft: "20%",
                        paddingRight: "20%",
                        marginBottom: "80px",
                        fontFamily: "Work Sans, sans-serif",
                    }}>These were the people behind this project who were dedicated in creating a Lost-and-Found focus technology solution, aiming to increase the rate of success in item retrieval
                </span>
            </div>

            <div className="row row-cols-1 d-flex justify-content-around gx-0 text-light">
                <div className="column1 col-6 d-flex align-items-center justify-content-start mt-5 mb-5"
                    style={{
                        width: "45vw",
                        backgroundColor: "#a2bbd1",
                        borderRadius: "27px",
                        padding: "50px",
                        position: "relative",
                        fontFamily: "Work Sans, sans-serif",
                    }}>

                    <img src="../../src/assets/dog1.png" alt=""
                        className="pic1 img-fluid"
                        style={{
                            width: "12vw",
                            minWidth: "90px",
                            maxWidth: "250px",
                            height: "auto",
                            position: "absolute",
                            top: "-50px",
                            left: "60px",
                            transform: "translateY(-10%)",
                        }} />

                    <div className="dev1 d-flex flex-column fs-2 fw-bold justify-content-center align-items-center" id="dev"
                        style={{
                            marginLeft: "40%",
                            whiteSpace: "nowrap",
                            zIndex: "1"
                        }}>
                        <span
                            style={{
                                fontSize: "clamp(14px, 2vw, 40px)",
                            }}>
                            Rain Andrei Aquino
                        </span>

                        <span
                            style={{
                                fontSize: "clamp(14px, 2vw, 40px)",
                            }}>
                            Developer
                        </span>
                    </div>
                </div>


                <div className="column1 col-6 d-flex align-items-center justify-content-start mt-5 mb-5"
                    style={{
                        width: "45vw",
                        backgroundColor: "#a2bbd1",
                        borderRadius: "27px",
                        padding: "50px",
                        position: "relative",
                        fontFamily: "Work Sans, sans-serif",
                    }}>

                    <div className="dev2 d-flex flex-column fw-bold justify-content-center align-items-center" id="dev"
                        style={{
                            marginLeft: "15%",
                            whiteSpace: "nowrap",
                            zIndex: "1"
                        }}>
                        <span
                            style={{
                                fontSize: "clamp(14px, 2vw, 40px)",
                            }}>
                            Sam Gabriel Arias
                        </span>

                        <span
                            style={{
                                fontSize: "clamp(14px, 2vw, 40px)",
                            }}>
                            Developer
                        </span>

                    </div>
                    <img src="../../src/assets/dog2.png" alt=""
                        className="pic2 img-fluid"
                        style={{
                            width: "12vw",
                            minWidth: "90px",
                            maxWidth: "250px",
                            height: "auto",
                            position: "absolute",
                            top: "-50px",
                            right: "12px",
                            transform: "translateY(-10%)"
                        }} />
                </div>

                <div className="column1 col-6 d-flex align-items-center justify-content-start mt-5 mb-5"
                    style={{
                        width: "45vw",
                        backgroundColor: "#a2bbd1",
                        borderRadius: "27px",
                        padding: "50px",
                        position: "relative",
                        fontFamily: "Work Sans, sans-serif",
                    }}>

                    <div className="dev2 d-flex flex-column fs-2 fw-bold justify-content-center align-items-center"
                        style={{
                            marginLeft: "15%",
                            whiteSpace: "nowrap",
                            zIndex: "1"
                        }}>
                        <span
                            style={{
                                fontSize: "clamp(14px, 2vw, 40px)",
                            }}>
                            Aezekiel Matthew Licardo
                        </span>

                        <span
                            style={{
                                fontSize: "clamp(14px, 2vw, 40px)",
                            }}>
                            Developer
                        </span>

                    </div>
                    <img src="../../src/assets/dog3.png" alt=""
                        className="pic2 img-fluid"
                        style={{
                            width: "12vw",
                            minWidth: "90px",
                            maxWidth: "250px",
                            height: "auto",
                            position: "absolute",
                            top: "-50px",
                            right: "15px",
                            transform: "translateY(-10%)",
                            zIndex: "0"
                        }} />
                </div>


                <div className="column1 col-6 d-flex align-items-center justify-content-start mt-5 mb-5"
                    style={{
                        width: "45vw",
                        backgroundColor: "#a2bbd1",
                        borderRadius: "27px",
                        padding: "50px",
                        position: "relative",
                        fontFamily: "Work Sans, sans-serif",
                    }}>

                    <img src="../../src/assets/dog4.png" alt=""
                        className="pic1 img-fluid"
                        style={{
                            width: "12vw",
                            minWidth: "90px",
                            maxWidth: "250px",
                            height: "auto",
                            position: "absolute",
                            top: "-50px",
                            left: "60px",
                            transform: "translateY(-10%)"
                        }} />

                    <div className="dev1 d-flex flex-column fs-2 fw-bold justify-content-center align-items-center"
                        style={{
                            marginLeft: "40%",
                            whiteSpace: "nowrap",
                            zIndex: "1"
                        }}>
                        <span
                            style={{
                                fontSize: "clamp(14px, 2vw, 40px)",
                            }}>
                            John Christian Lomotan
                        </span>

                        <span
                            style={{
                                fontSize: "clamp(14px, 2vw, 40px)",
                            }}>
                            Developer
                        </span>
                    </div>
                </div>

                <div className="column1 col-6 d-flex align-items-center justify-content-start mt-5 mb-5"
                    style={{
                        width: "45vw",
                        backgroundColor: "#a2bbd1",
                        borderRadius: "27px",
                        padding: "50px",
                        position: "relative",
                        fontFamily: "Work Sans, sans-serif",
                    }}>

                    <img src="../../src/assets/dog5.png" alt=""
                        className="pic1 img-fluid"
                        style={{
                            width: "12vw",
                            minWidth: "90px",
                            maxWidth: "250px",
                            height: "auto",
                            position: "absolute",
                            top: "-50px",
                            left: "60px",
                            transform: "translateY(-10%)"
                        }} />

                    <div className="dev1 d-flex flex-column fs-2 fw-bold justify-content-center align-items-center"
                        style={{
                            marginLeft: "40%",
                            whiteSpace: "nowrap",
                            zIndex: "1"
                        }}>
                        <span
                            style={{
                                fontSize: "clamp(14px, 2vw, 40px)",
                            }}>
                            Aug John Lie Mosende
                        </span>

                        <span
                            style={{
                                fontSize: "clamp(14px, 2vw, 40px)",
                            }}>
                            Developer
                        </span>
                    </div>
                </div>


                <div className="column1 col-6 d-flex align-items-center justify-content-start mt-5 mb-5"
                    style={{
                        width: "45vw",
                        backgroundColor: "#a2bbd1",
                        borderRadius: "27px",
                        padding: "50px",
                        position: "relative",
                        fontFamily: "Work Sans, sans-serif",
                    }}>

                    <div className="dev2 d-flex flex-column fs-2 fw-bold justify-content-center align-items-center"
                        style={{
                            marginLeft: "15%",
                            whiteSpace: "nowrap",
                            zIndex: "1"
                        }}>
                        <span
                            style={{
                                fontSize: "clamp(14px, 2vw, 40px)",
                            }}>
                            Justin Cloud Tomaquin
                        </span>

                        <span
                            style={{
                                fontSize: "clamp(14px, 2vw, 40px)",
                            }}>
                            Developer
                        </span>

                    </div>
                    <img src="../../src/assets/dog6.png" alt=""
                        className="pic2 img-fluid"
                        style={{
                            width: "12vw",
                            minWidth: "90px",
                            maxWidth: "250px",
                            height: "auto",
                            position: "absolute",
                            top: "-50px",
                            right: "15px",
                            transform: "translateY(-10%)"
                        }} />

                </div>
            </div>

            <div className="mt-5">
                <footer className="text-white"
                    style={{
                        padding: "50px",
                        backgroundColor: "#142343"
                    }}>

                    <div className="footer container d-flex align-items-center"
                        style={{
                            borderLeft: "2px solid white",
                            width: "100%"
                        }}>

                        <section className="contactinfo">
                            <span className="d-flex fw-bold mt-4 me-5 ms-3" style={{ fontSize: "calc(1rem + 1vw)", fontFamily: "Work Sans, sans-serif", }}>CONTACT US ON
                            </span>
                            <ul className="d-flex flex-column pt-4 pb-4">
                                <i className="bi bi-facebook pb-3" style={{ color: "white", fontSize: "calc(0.8rem + 0.8vw)" }}>
                                    <span className="ms-2"> @FLOCodeXPH</span>
                                </i>
                                <i className="emailflo bi bi-envelope-fill pt-4 pb-3" style={{ color: "white", fontSize: "calc(0.8rem + 0.8vw)", width: "30vw" }}>
                                    <span className="ms-2"> @FLOCodeXPH.gmail.com</span>
                                </i>
                                <i className="bi bi-telephone-fill pt-4" style={{ color: "white", fontSize: "calc(0.8rem + 0.8vw)" }}>
                                    <span className="ms-2"> 63+ 904 516 2706</span>
                                </i>
                            </ul>
                        </section>

                        <div>
                            <form className="suggest d-flex flex-column">
                                <label className="mb-2 fs-lg-2 fw-bold" style={{ fontSize: "calc(0.6rem + 0.6vw)", width: "100vw" }}>For more inquires, questions, and suggestions:</label>
                                <textarea className="forinquiry"
                                    style={{
                                        fontFamily: "Work Sans, sans-serif",
                                        padding: "10px",
                                        marginBottom: "10px",
                                        borderRadius: "27px",
                                        border: "1px solid #ccc",
                                        outline: "none",
                                        resize: "none",
                                        width: "37vw",
                                        height: "17vh"
                                    }} />
                                <div className="d-flex justify-content-lg-end justify-content-sm-start" style={{ width: "37vw" }}>
                                    <button
                                        className="p-2"
                                        type="submit"
                                        style={{
                                            fontFamily: "Work Sans, sans-serif",
                                            width: "150px",
                                            minWidth: "150px",
                                            border: "none",
                                            borderRadius: "20px",
                                            fontSize: "clamp(14px, 1.5vw, 16px)",
                                            color: "#fafcff",
                                            backgroundColor: "#004aad",
                                        }}>
                                        <span className="fs-5">Submit</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </footer>
            </div>

        </div >
    )
}

export default Aboutus;
