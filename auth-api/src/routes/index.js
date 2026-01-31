const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware');

const authController = require('../controllers/auth-controller');
const firebaseAuthController = require('../controllers/firebase-auth-controller');
const PostsController = require('../controllers/posts-controller.js');
const signalementController = require("../controllers/signalement-controller.js");

// Routes avec fallback automatique Firebase -> PostgreSQL
router.post('/api/register', authController.registerUser);
router.post('/api/login', authController.loginUser);
router.post('/api/logout', authController.logoutUser);
router.post('/api/reset-password', authController.resetPassword);
router.get('/api/auth/status', authController.getStatus);
router.post('/api/firebase/block-user',authController.blockUser);
router.post('/api/firebase/unblock-user',authController.unblockUser);
router.get('/api/users',authController.getAllUsers);
router.post('/api/sync', authController.syncDatabases);

router.post('/api/firebase/register', firebaseAuthController.registerUser);
router.post('/api/firebase/login', firebaseAuthController.loginUser);
router.post('/api/firebase/logout', firebaseAuthController.logoutUser);
router.post('/api/firebase/reset-password', firebaseAuthController.resetPassword);



router.get("/api/signalements", signalementController.list);
router.get("/api/signalements/user/:userId", signalementController.getByUserId);
router.get("/api/signalements/:id", signalementController.get);
router.post("/api/signalements", signalementController.create);
router.put("/api/signalements/:id", signalementController.update);
router.delete("/api/signalements/:id", signalementController.delete);
router.post("/api/signalements/cleanup/timestamps", signalementController.cleanupTimestamps);

router.get('/api/posts', verifyToken, PostsController.getPosts);

module.exports = router;