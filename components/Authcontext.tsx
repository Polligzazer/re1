import { createContext, useEffect, useState, ReactNode, useContext } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../src/firebase";

interface ExtendedUser {
  uid: string;
  email: string | null;
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
  refreshUser: () => void; 
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

export const AuthContextProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  let unsubscribeDoc: (() => void) | undefined;

  const clearSubscriptions = () => {
    if (unsubscribeDoc) unsubscribeDoc();
    unsubscribeDoc = undefined;
  };

  const subscribeToUser = (user: User) => {
    setLoading(true);
    const userDocRef = doc(db, "users", user.uid);
    unsubscribeDoc = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          const adminFlag = !!data.isAdmin;

          setCurrentUser({
            uid: user.uid,
            email: user.email,
            schoolId: data.schoolId,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            isAdmin: adminFlag,
          });
          setIsAdmin(adminFlag);
        } else {
          setCurrentUser({ uid: user.uid, email: user.email });
          setIsAdmin(false);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firestore snapshot error:", error);
        setLoading(false);
        setIsAdmin(false);
      }
    );
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      clearSubscriptions();
      if (user) {
        subscribeToUser(user);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      clearSubscriptions();
    };
  }, []);
  
  const refreshUser = () => {
    if (auth.currentUser) {
      subscribeToUser(auth.currentUser);
    }
  };  

  return (
    <AuthContext.Provider value={{ currentUser, loading, isAdmin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
