import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration is now sourced from environment variables.
// In Expo, any variable prefixed with EXPO_PUBLIC_ is embedded in the client bundle.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID as string,
};

// Initialize and export
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
