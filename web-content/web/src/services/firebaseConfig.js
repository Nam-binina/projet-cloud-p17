// Firebase config not needed on frontend
// All authentication is handled via backend API (hybrid system)
// Backend will use Firebase or PostgreSQL transparently

let firebaseAuth = null;
let firebaseInitialized = false;

console.log('Using backend API for authentication (Firebase/PostgreSQL hybrid system)');

export { firebaseAuth, firebaseInitialized };
