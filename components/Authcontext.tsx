import { createContext, useEffect, useState, ReactNode } from "react";
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
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserDoc;

          const { schoolId, firstName, lastName, role, isAdmin: isAdminFlag } = userData;

          const extendedUser: ExtendedUser = {
            ...user,
            schoolId,
            firstName,
            lastName,
            role,
            isAdmin: Boolean(isAdminFlag),
          };

          setCurrentUser(extendedUser);
          setIsAdmin(Boolean(isAdminFlag));
        } else {
          setCurrentUser({ ...user });
          setIsAdmin(false);
        }
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
        const userData = userDocSnap.data() as UserDoc;

        const extendedUser: ExtendedUser = {
          ...(auth.currentUser as User),
          schoolId: userData.schoolId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          isAdmin: Boolean(userData.isAdmin),
        };

        setCurrentUser(extendedUser);
        setIsAdmin(Boolean(userData.isAdmin));

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
