import React, { useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { db } from "../src/firebase"; // adjust path as needed
import { Table, Button, Spinner } from "react-bootstrap";
import "../css/profile.css"

interface UserReportsTableProps {
  userId: string;
}

const UserReportsTable: React.FC<UserReportsTableProps> = ({ userId }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const q = query(collection(db, "lost_items"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        const fetchedReports = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(fetchedReports);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchReports();
  }, [userId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;

    try {
      await deleteDoc(doc(db, "lost_items", id));
      setReports((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete report.");
    }
  };

  if (loading) return <Spinner animation="border" className="my-4" />;

  return (
    <div className="my-4 pdiv">
      <h4 className="mb-3">My reported items</h4>
      {reports.length === 0 ? (
        <p>No lost item reports yet.</p>
      ) : (
        <div className="">
          <Table striped bordered hover className="table">
            <thead>
              <tr className="text-center">
                <th className="th1">Item</th>
                <th className="th1">Type</th>
                <th className="th1">Description</th>
                <th className="th1">Location</th>
                <th className="th1">Date</th>
                <th className="th1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="text-center">
                  <td className="td1">{report.item} ({report.category})</td>
                  <td className="td1">{report.type}</td>
                  <td className="td1">{report.description}</td>
                  <td className="td1">{report.location}</td>
                  <td className="td1">{report.date}</td>
                  <td>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(report.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default UserReportsTable;
