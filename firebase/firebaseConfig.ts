import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBMqqLdTI3GH2iFCT7kYQYauOBSLI84FSs",
  authDomain: "recoverygo-fce10.firebaseapp.com",
  projectId: "recoverygo-fce10",
  storageBucket: "recoverygo-fce10.appspot.com",
  messagingSenderId: "474041637903",
  appId: "1:474041637903:web:ee39b6282a392b9655d77a",
};

// Initialize and export
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
