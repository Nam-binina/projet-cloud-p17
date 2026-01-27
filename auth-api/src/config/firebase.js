require("dotenv").config();
const firebase = require("firebase/app");
const { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  sendPasswordResetEmail

} = require("firebase/auth") ;


const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase only if config is valid (all keys present and not empty)
let firebaseInitialized = false;
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    firebase.initializeApp(firebaseConfig);
    firebaseInitialized = true;
    console.log('Firebase initialized successfully on backend');
  } catch (error) {
    console.warn('Firebase initialization failed on backend:', error.message);
  }
} else {
  console.warn('Firebase config is incomplete, using PostgreSQL only');
}

module.exports = {
  getAuth: firebaseInitialized ? getAuth : () => null,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  firebaseInitialized
};