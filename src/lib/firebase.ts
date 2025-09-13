// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJTVUKsaNqy_5vJnAU0fsxrBvuOWpM470",
  authDomain: "zippylink-6f451.firebaseapp.com",
  projectId: "zippylink-6f451",
  storageBucket: "zippylink-6f451.appspot.com",
  messagingSenderId: "801274049790",
  appId: "1:801274049790:web:71afb2793b3c40b42d21af",
  measurementId: "G-15Z12GGFBF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
