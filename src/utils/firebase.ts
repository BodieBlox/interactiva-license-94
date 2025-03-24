
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWGWoKeIngkEB_oPaf7NWgLJEbdsnmUHQ",
  authDomain: "orgid-f590b.firebaseapp.com",
  projectId: "orgid-f590b",
  storageBucket: "orgid-f590b.appspot.com",
  messagingSenderId: "662476352168",
  appId: "1:662476352168:web:1f50232f11b45c7e9db09d",
  measurementId: "G-RRCKE0PDMT",
  databaseURL: "https://orgid-f590b-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

// Helper function to create a user in Firebase Auth
export const createFirebaseUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error creating user in Firebase Auth:", error);
    throw error;
  }
};

// Helper for signing in
export const signInFirebaseUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in with Firebase Auth:", error);
    throw error;
  }
};
