import { useState, useEffect } from "react";
import { motion, useAnimation, useMotionValue } from "framer-motion";
import { FaSearch, FaWallet, FaKey, FaMobile, FaLaptop, FaHeadphones } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const foundItems = [
  { id: "wallet", icon: <FaWallet className="text-danger" size={50} />, position: 1 },
  { id: "key", icon: <FaKey className="text-warning" size={50} />, position: 3 },
  { id: "mobile", icon: <FaMobile className="text-primary" size={50} />, position: 5 },
  { id: "laptop", icon: <FaLaptop className="text-secondary" size={50} />, position: 7 },
  { id: "headphones", icon: <FaHeadphones className="text-info" size={50} />, position: 9 },
];

const Loading = () => {
  const [dots, setDots] = useState("");
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const controls = useAnimation();
  const x = useMotionValue(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    controls.start({
      x: [0, 80, 140, 80, 0, -80, -140, -80, 0],
      y: [0, -50, 0, 50, 0, 50, 0, -50, 0],
      transition: { duration: 7, ease: "easeInOut", repeat: Infinity },
    });
  }, [controls]);

  // Watch `x` motion value and update visible items dynamically
  useEffect(() => {
    const unsubscribe = x.onChange((latest) => {
      const index = Math.round((latest + 140) / 40);
      const itemsToShow = foundItems.filter((item) => item.position === index).map((item) => item.position);
      setVisibleItems(itemsToShow);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [x]);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 position-relative bg-light overflow-hidden">
      {/* Clouds */}
      <div className="cloud cloud-1"></div>
      <div className="cloud cloud-2"></div>
      <div className="cloud cloud-3"></div>
      
      {/* Magnifying Glass Animation */}
      <motion.div animate={controls} className="position-relative mb-4" style={{ x, width: 140, height: 140 }}>
        <FaSearch size={140} className="text-primary position-absolute" />
        {foundItems.map((item) =>
          visibleItems.includes(item.position) ? (
            <motion.div
              key={item.id}
              className="position-absolute"
              style={{ top: 33, left: 33 }}
              animate={{ scale: [0.3, 0.6, 0.3], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              {item.icon}
            </motion.div>
          ) : null
        )}
      </motion.div>

      {/* Loading Text */}
      <p className="position-absolute start-50 translate-middle-x text-dark" style={{ bottom: "20vh" }}>
        Loading{dots}
      </p>

      {/* Cloud Styles */}
      <style>
      {`
          .cloud {
            position: absolute;
            background: white;
            opacity: 0.8;
            filter: blur(5px);
            border-radius: 50%;
            box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.1);
            animation: floatClouds 10s linear infinite alternate;
          }

          .cloud-1 {
            top: 10%;
            left: 5%;
            width: 120px;
            height: 60px;
          }
          .cloud-1::before, .cloud-1::after {
            content: "";
            position: absolute;
            background: white;
            border-radius: 50%;
          }
          .cloud-1::before {
            width: 70px;
            height: 50px;
            top: -30px;
            left: 20px;
          }
          .cloud-1::after {
            width: 90px;
            height: 60px;
            top: -20px;
            right: 10px;
          }

          .cloud-2 {
            top: 25%;
            left: 50%;
            width: 140px;
            height: 70px;
          }
          .cloud-2::before, .cloud-2::after {
            content: "";
            position: absolute;
            background: white;
            border-radius: 50%;
          }
          .cloud-2::before {
            width: 80px;
            height: 60px;
            top: -30px;
            left: 20px;
          }
          .cloud-2::after {
            width: 100px;
            height: 70px;
            top: -20px;
            right: 10px;
          }

          .cloud-3 {
            top: 15%;
            right: 5%;
            width: 160px;
            height: 80px;
          }
          .cloud-3::before, .cloud-3::after {
            content: "";
            position: absolute;
            background: white;
            border-radius: 50%;
          }
          .cloud-3::before {
            width: 90px;
            height: 70px;
            top: -35px;
            left: 30px;
          }
          .cloud-3::after {
            width: 110px;
            height: 80px;
            top: -25px;
            right: 15px;
          }

          @keyframes floatClouds {
            0% { transform: translateX(0px); }
            50% { transform: translateX(30px); }
            100% { transform: translateX(0px); }
          }
        `}
      </style>
    </div>
  );
};

export default Loading;
