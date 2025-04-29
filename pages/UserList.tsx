import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import "../css/userlist.css";
import { db } from "../src/firebase";


const UserList = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const auth = getAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const querySnapshot = await getDocs(usersCollection);

        const usersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!auth.currentUser) {
      return alert("No user is signed in.");
    }
  
    if (!window.confirm("Are you sure you want to delete this user and all their data?")) {
      return;
    }
  
    try {
      const token = await auth.currentUser.getIdToken(true);
      if (!token) throw new Error("Not authenticated");
  
      const res = await fetch('https://flo-proxy.vercel.app/api/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ uid: userId }),
        credentials: 'include', // Important for CORS with credentials
      });
  
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || res.statusText);
      }
  
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert("User deleted successfully");
    } catch (err) {
      console.error("Delete failed:", err);
      
      // Proper error handling with type checking
      let errorMessage = "Failed to delete user";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
  
      alert(`Error: ${errorMessage}`);
    }
  };

  // Improved filtering logic
  const searchLower = searchTerm.toLowerCase();
  const filteredUsers = users.filter((user) => 
    user.firstName?.toLowerCase().includes(searchLower) ||
    user.middleInitial?.toLowerCase().includes(searchLower) ||
    user.lastName?.toLowerCase().includes(searchLower) ||
    user.email?.toLowerCase().includes(searchLower) ||
    user.schoolId?.toLowerCase().includes(searchLower) ||
    `${user.role} ${user.strandOrCourse || ""} ${user.yearSection || ""}`
      .toLowerCase()
      .includes(searchLower) ||
    user.contact?.toLowerCase().includes(searchLower)
  );

  return (
    <div className="container-fluid mt-5">
      <div className="ms-2 justify-content-start">
        <h2 className="fw-bold text-start mt-5" style={{
           fontFamily: "DM Sans, sans-serif", 
           fontSize:'25px'
        }}>User List</h2>
        <p className="mb-5" style={{
          fontFamily: "Poppins, sans-serif",
          color:'#454545'
        }}><small>Track the users in the FLO Application</small></p>
      </div>
      {/* Search Input */}
      <div className="ms-3 mb-4 d-flex flex-row">
      <p className=" fw-bold align-self-end me-2" style={{
           fontFamily: "DM Sans, sans-serif", 
           fontSize:'19px'
        }}>Filter by:</p>
        <input
          type="text"
          placeholder="Search by Name, School ID, etc..."
          className="form-control p-3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            border:'1px solid #89ccff',
            borderRadius:'30px'
          }}
        />
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
      <div className="pdiv m-0 p-0 mb-4 ">  
        <table className="table table-striped table-bordered" style={{
          fontFamily: "DM Sans, sans-serif", 
          
        }}>
          <thead className="sticky-top">
            <tr className="text-center">
              <th className="th1">Name</th>
              <th className="th1">Email</th>
              <th className="th1">School ID</th>
              <th className="th1">Role & Section</th>
              <th className="th1">Contact</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr className="text-center" key={user.id}>
                  <td className="td1" >{`${user.firstName} ${user.middleInitial || ""}. ${user.lastName}`}</td>
                  <td className="td1" >{user.email}</td>
                  <td className="td1">{user.schoolId}</td>
                  <td className="td1">
                    {user.role === "student"
                      ? `${user.role} - ${user.strandOrCourse} - ${user.yearSection}`
                      : user.role}
                  </td>
                  <td className="td1">{user.contact}</td>
                  <td className="td1">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="btn btn-danger btn-sm"
                      style={{ borderRadius: '20px', padding: '5px 15px', fontSize: '14px' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : ( 
              <tr>
                <td colSpan={5} className="text-center">
                  No matching users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

export default UserList;
