// Firebase config not needed on frontend
// All data access must go through auth-api (PostgreSQL)

let firebaseAuth = null;
let firebaseInitialized = false;

console.log('Using backend API for data access (PostgreSQL via auth-api)');

export { firebaseAuth, firebaseInitialized };
