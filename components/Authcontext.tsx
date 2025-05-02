import { createContext, useEffect, useState, ReactNode, useContext } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../src/firebase";

interface ExtendedUser extends User {
  schoolId?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  currentUser: ExtendedUser | null;
  loading: boolean;
  isAdmin: boolean;
  refreshUser: (uid?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  isAdmin: false,
  refreshUser: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

interface UserDoc {
  schoolId?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isAdmin?: boolean;
}

export const AuthContextProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUserData = async (user: User) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      console.log("Fetching document from:", userDocRef.path);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as UserDoc;
        console.log("Fetched user document data:", userData);

        const { schoolId, firstName, lastName, role, isAdmin } = userData;

        // Log the specific isAdmin value
        console.log("Firestore isAdmin field raw value:", isAdmin);

        const extendedUser: ExtendedUser = {
          ...user,
          schoolId,
          firstName,
          lastName,
          role,
          isAdmin: Boolean(isAdmin), // Convert isAdmin to boolean just in case
        };

        setCurrentUser(extendedUser);
        setIsAdmin(Boolean(isAdmin)); // Ensure it’s a boolean
      } else {
        console.log("User document does not exist.");
        setCurrentUser({ ...user });
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setCurrentUser(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (!user) {
        setCurrentUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Call refreshUser to fetch data from Firestore after auth state change
        await refreshUser(user.uid);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setCurrentUser(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async (uid?: string): Promise<void> => {
    const userId = uid || auth.currentUser?.uid;

    if (!userId) {
      console.warn("⚠️ No user ID found for refreshUser");
      return;
    }

    setLoading(true);

    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        console.log("Firestore User Data:", userData);
        const isAdminFlag = userData.isAdmin;

        const extendedUser: ExtendedUser = {
          ...(auth.currentUser as User),
          schoolId: userData.schoolId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          isAdmin: Boolean(isAdminFlag), // Ensure isAdmin is a boolean
        };

        setCurrentUser(extendedUser);
        setIsAdmin(Boolean(isAdminFlag));
        console.log("✅ User refreshed successfully:", extendedUser);
      } else {
        console.warn("⚠️ No user data found in Firestore on refresh");
      }
    } catch (error) {
      console.error("❌ Error refreshing user:", error);
    }

    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, isAdmin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
