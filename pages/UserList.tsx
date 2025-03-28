import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../src/firebase";
import Topbar from "../components/Topbar";

const UserList = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
      <Topbar />
      <h2 className="text-center my-5">User List</h2>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search by Name, School ID, etc..."
        className="form-control mb-3"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table table-striped table-bordered">
          <thead>
            <tr className="text-center">
              <th>Name</th>
              <th>Email</th>
              <th>School ID</th>
              <th>Role & Section</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr className="text-center" key={user.id}>
                  <td>{`${user.firstName} ${user.middleInitial || ""}. ${user.lastName}`}</td>
                  <td>{user.email}</td>
                  <td>{user.schoolId}</td>
                  <td>
                    {user.role === "student"
                      ? `${user.role} - ${user.strandOrCourse} - ${user.yearSection}`
                      : user.role}
                  </td>
                  <td>{user.contact}</td>
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
      )}
    </div>
  );
};

export default UserList;
