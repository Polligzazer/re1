import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../src/firebase";

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
  const [category, setCategory] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const searchParams = useQueryParams();
  const navigate = useNavigate();
  const queryKeyword = searchParams.get("query") || "";

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
        if (dateFrom || dateTo) {
          let fromTimestamp = dateFrom ? Timestamp.fromDate(new Date(dateFrom)) : null;
          let toTimestamp = dateTo ? Timestamp.fromDate(new Date(dateTo)) : null;
    
          if (fromTimestamp) constraints.push(where("timestamp", ">=", fromTimestamp));
          if (toTimestamp) constraints.push(where("timestamp", "<=", toTimestamp));
        }
    
        const q = query(reportsRef, ...constraints);
        const querySnapshot = await getDocs(q);
    
        let fetchedReports = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Report[];
    
        // 🔍 **Post-Fetch Keyword Search** (Firestore doesn't support partial text search)
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

  return (
    <div className="container mt-4">
      <button className="btn btn-secondary mb-4" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h2 className="mb-4">Search Results for: "{queryKeyword}"</h2>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-3">
          <label>Category:</label>
          <select
            className="form-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All</option>
            <option value="Gadgets">Gadgets</option>
            <option value="School Belongings">School Belongings</option>
            <option value="Accessories/Personal Belongings">Personal Belongings</option>
            <option value="Others">Others</option>
          </select>
        </div>

        <div className="col-md-3">
          <label>Report Type:</label>
          <select
            className="form-control"
            value={type}
            onChange={(e) => setType(e.target.value)}
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
            className="form-control"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <label>Date To:</label>
          <input
            type="date"
            className="form-control"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* Results */}
      {queryKeyword.trim() === "" ? (
        <p>Please type something to search.</p>
      ) : filteredReports.length === 0 ? (
        <p>No reports found.</p>
      ) : (
        <ul className="list-group">
          {filteredReports.map((report) => (
            <li key={report.id} className="list-group-item mb-3">
              <h4>{report.category}</h4>
              <p>Location: {report.location}</p>
              <p>
                Date:{" "}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchPage;
