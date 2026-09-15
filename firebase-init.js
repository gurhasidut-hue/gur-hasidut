import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAwr9KYB-DPYBKb3FXQidFe5sBfnSaLNK4",
  authDomain: "gurr-f35aa.firebaseapp.com",
  projectId: "gurr-f35aa",
  storageBucket: "gurr-f35aa.firebasestorage.app",
  messagingSenderId: "516193339347",
  appId: "1:516193339347:web:eb17691f4518e721e09126",
  measurementId: "G-VCEK8KCV7W"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export { doc, getDoc, setDoc, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged };
