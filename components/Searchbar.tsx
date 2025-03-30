import {useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../src/firebase";
import categoryImages from "../src/categoryimage";
import { handleSend } from "../chatcomponents/handleSend";
import { AuthContext } from "../components/Authcontext";
import { useChatContext } from "../components/ChatContext";
import "../css/searchbar.css";

interface Report {
  type: string;
  item: any;
  id: string;
  category: string;
  description: string;
  location: string;
  date?: Timestamp | string | number;
}

const useQueryParams = () => {
  return new URLSearchParams(useLocation().search);
};

const SearchPage = () => {
  const [, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [category, setCategory] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const { currentUser } = useContext(AuthContext);
  const { dispatch } = useChatContext();
  const searchParams = useQueryParams();
  const navigate = useNavigate();
  const queryKeyword = searchParams.get("query") || "";
  const ITEMS_PER_LOAD = 5;
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        if (!queryKeyword.trim()) {
          setReports([]);
          return;
        }

        const reportsRef = collection(db, "lost_items");

        let constraints = [where("status", "==", "approved")];

        // Apply Category Filter
        if (category !== "all") {
          constraints.push(where("category", "==", category));
        }

        // Apply Type Filter (Lost/Found/Claimed)
        if (type !== "all") {
          constraints.push(where("type", "==", type));
        }

        // Apply Date Range Filter
        
        
        const q = query(reportsRef, ...constraints);
        const querySnapshot = await getDocs(q);
        
        let fetchedReports = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Report[];

        // 🔍 Post-Fetch Keyword Search (Firestore doesn't support partial text search)
        const keywordLower = queryKeyword.toLowerCase();
        fetchedReports = fetchedReports.filter(
          (report) =>
            report.category.toLowerCase().includes(keywordLower) ||
            report.description.toLowerCase().includes(keywordLower) ||
            report.location.toLowerCase().includes(keywordLower) ||
            report.item.toLowerCase().includes(keywordLower) ||
            report.type.toLowerCase().includes(keywordLower)
        );

        setReports(fetchedReports);
        setFilteredReports(fetchedReports);
      } catch (error) {
        console.error("🔥 Error fetching search results:", error);
      }
    };

    fetchReports();
  }, [queryKeyword, category, type, dateFrom, dateTo]);

  const handleInquire = (reportId: string) => {
    if (!currentUser) {
      alert("You must be logged in to inquire.");
      return;
    }

    const adminUID = "rWU1JksUQzUhGX42FueojcWo9a82";
    const adminUserInfo = { uid: adminUID, name: "Admin" };

    dispatch({ type: "CHANGE_USER", payload: adminUserInfo });

    const combinedId = currentUser.uid > adminUID ? currentUser.uid + adminUID : adminUID + currentUser.uid;

    handleSend(
      () => { },
      () => { },
      `Inquiring about report ID: ${reportId}`,
      { chatId: combinedId, user: adminUserInfo },
      currentUser,
      reportId
    );

    navigate("/inquiries");
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + ITEMS_PER_LOAD, filteredReports.length));
        }
      },
      { rootMargin: "100px" }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [filteredReports.length]);

  return (
    <div className="container mt-5 pt-5">
      <div className="container mt-4">
        <button className="btn mb-4" onClick={() => navigate(-1)}>← Back</button>
        <div>
          <h2 className="mb-4">Search Results for: "{queryKeyword}"</h2>
        </div>

        {/* Filters */}
        <div className="row mb-4 fw-bold" style={{ color: "#2169ac" }}>
          <div className="col-md-3">
            <label>Category:</label>
            <select
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ borderBottom: "1px solid #2c6dc2", height: "auto" }}
            >
              <option value="all">All</option>
              <option value="Gadgets">Gadgets</option>
              <option value="School Belongings">School Belongings</option>
              <option value="Personal Belongings">
                Personal Belongings
              </option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div className="col-md-3">
            <label>Report Type:</label>
            <select
              className="form-control"
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ borderBottom: "1px solid #2c6dc2", height: "auto" }}
            >
              <option value="all">All</option>
              <option value="lost">Lost Item</option>
              <option value="found">Found Item</option>
              <option value="history">History</option>
            </select>
          </div>

          <div className="col-md-3">
            <label>Date From:</label>
            <input
              type="date"
              className="form-control p-3"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ border: "1px solid #2c6dc2" }}
            />
          </div>

          <div className="col-md-3">
            <label>Date To:</label>
            <input
              type="date"
              className="form-control p-3"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ border: "1px solid #2c6dc2" }}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {queryKeyword.trim() === "" ? (
        <p>Please type something to search.</p>
      ) : filteredReports.length === 0 ? (
        <p>No reports found.</p>
      ) : (
        <div className="search-results d-flex row row-cols-2 justify-content-center">
          {filteredReports.slice(0, visibleCount).map((report) => (
            <div key={report.id} className="report-card-search p-3 align-items-center mb-4 m-3">
              <div
                className="imgreport-div d-flex align-items-center p-3 me-4"
                style={{ borderRight: "1px solid white" }}
              >
                <img
                  src={categoryImages[report.category] || "../src/assets/othersIcon.png"}
                  alt={report.category}
                  className="report-image"
                />
              </div>
              <div style={{ width: "100%", fontFamily: "Poppins, sans-serif" }}>
                <p className="report-info"><strong>{report.category}</strong></p>
                <p className="report-info"><strong>Location:</strong> {report.location}</p>
                <p>
                  <strong> Date:</strong> {" "}
                  {report.date
                    ? (() => {
                      const dateObj =
                        report.date instanceof Timestamp
                          ? report.date.toDate()
                          : new Date(report.date);

                      const day = String(dateObj.getDate()).padStart(2, "0"); // Ensure 2 digits
                      const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Month is 0-based
                      const year = dateObj.getFullYear();

                      return `${day}/${month}/${year}/`;
                    })()
                    : "N/A"}
                </p>
                <button className="inquire-button ms-3" onClick={() => handleInquire(report.id)}>Inquire</button>
              </div>
            </div>
          ))}

          {visibleCount < filteredReports.length && (
            <div ref={loadMoreRef} style={{ height: "20px", background: "transparent" }}></div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
