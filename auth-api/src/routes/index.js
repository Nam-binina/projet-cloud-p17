const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware');

const authController = require('../controllers/auth-controller');
const firebaseAuthController = require('../controllers/firebase-auth-controller');
const PostsController = require('../controllers/posts-controller.js');

// Routes avec fallback automatique Firebase -> PostgreSQL
router.post('/api/register', authController.registerUser);
router.post('/api/login', authController.loginUser);
router.post('/api/logout', authController.logoutUser);
router.post('/api/reset-password', authController.resetPassword);
router.get('/api/auth/status', authController.getStatus);
router.post('/api/firebase/block-user',authController.blockUser);
router.post('/api/firebase/unblock-user',authController.unblockUser);
router.get('/api/users',authController.getAllUsers);

router.post('/api/firebase/register', firebaseAuthController.registerUser);
router.post('/api/firebase/login', firebaseAuthController.loginUser);
router.post('/api/firebase/logout', firebaseAuthController.logoutUser);
router.post('/api/firebase/reset-password', firebaseAuthController.resetPassword);

router.get('/api/posts', verifyToken, PostsController.getPosts);

module.exports = router;
