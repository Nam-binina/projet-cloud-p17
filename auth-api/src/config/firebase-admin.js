const admin = require('firebase-admin');
const path = require('path');
require("dotenv").config();

const serviceAccountPath = path.resolve(
  __dirname, '../../',
  process.env.FIREBASE_SERVICE_ACCOUNT || 'firebase-service-account.json'
);

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;