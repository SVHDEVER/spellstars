import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase project configuration
// Get this from Firebase Console > Project Settings > Your apps > Web app
const firebaseConfig = {
  apiKey: "AIzaSyDT6-giONsnB1BnM66quzj4InGL04quxQ8",
  authDomain: "spellstars-1852f.firebaseapp.com",
  projectId: "spellstars-1852f",
  storageBucket: "spellstars-1852f.firebasestorage.app",
  messagingSenderId: "399813421674",
  appId: "1:399813421674:web:40a66401d6ec6b424c7813"
"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);