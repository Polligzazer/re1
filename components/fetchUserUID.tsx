import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../src/firebase";

const fetchUserUID = async (): Promise<string | null> => {
  const auth = getAuth();

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            resolve(userData.uid);
          } else {
            console.error("❗ User document not found in Firestore.");
            resolve(null);
          }
        } catch (error) {
          console.error("❗ Error fetching user document:", error);
          resolve(null);
        }
      } else {
        console.error("❗ User is not authenticated.");
        resolve(null);
      }
      unsubscribe();
    });
    setTimeout(() => {
      resolve(null);
    }, 5000);
  });
};

export default fetchUserUID;
  