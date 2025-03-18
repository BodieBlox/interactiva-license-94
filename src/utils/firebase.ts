
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWGWoKeIngkEB_oPaf7NWgLJEbdsnmUHQ",
  authDomain: "orgid-f590b.firebaseapp.com",
  projectId: "orgid-f590b",
  storageBucket: "orgid-f590b.firebasestorage.app",
  messagingSenderId: "662476352168",
  appId: "1:662476352168:web:1f50232f11b45c7e9db09d",
  measurementId: "G-RRCKE0PDMT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
