const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware');
const requireRole = require('../middleware/requireRole');

const authController = require('../controllers/auth-controller');
const firebaseAuthController = require('../controllers/firebase-auth-controller');
const PostsController = require('../controllers/posts-controller.js');
const signalementController = require("../controllers/signalement-controller.js");
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadRoot = process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const { id } = req.params;
		const targetDir = path.join(uploadRoot, 'signalements', id || 'unknown');
		fs.mkdirSync(targetDir, { recursive: true });
		cb(null, targetDir);
	},
	filename: (req, file, cb) => {
		const safeName = file.originalname.replace(/\s+/g, '_');
		cb(null, `${Date.now()}-${safeName}`);
	}
});

const upload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 }
});

// Routes avec fallback automatique Firebase -> PostgreSQL
router.post('/api/register', authController.registerUser);
router.post('/api/login', authController.loginUser);
router.post('/api/logout', authController.logoutUser);
router.post('/api/reset-password', authController.resetPassword);
router.put('/api/users/:id/password', authController.changePassword);
router.get('/api/auth/status', authController.getStatus);
router.post('/api/users/block', authController.blockUser);
router.post('/api/users/unblock', authController.unblockUser);
router.get('/api/users',authController.getAllUsers);
router.post('/api/sync', verifyToken, requireRole('manager'), authController.syncDatabases);
router.post('/api/token/refresh', authController.refreshToken);

// router.post('/api/firebase/register', firebaseAuthController.registerUser);
// router.post('/api/firebase/login', firebaseAuthController.loginUser);
// router.post('/api/firebase/logout', firebaseAuthController.logoutUser);
// router.post('/api/firebase/reset-password', firebaseAuthController.resetPassword);



router.get("/api/signalements", signalementController.list);
router.get("/api/signalements/user/:userId", signalementController.getByUserId);
router.get("/api/signalements/:id", signalementController.get);
router.post("/api/signalements", signalementController.create);
router.put("/api/signalements/:id", signalementController.update);
router.delete("/api/signalements/:id", signalementController.delete);
router.post("/api/signalements/cleanup/timestamps", signalementController.cleanupTimestamps);
router.post("/api/signalements/:id/photos", upload.array('photos', 6), signalementController.uploadPhotos);
router.get("/api/signalements/:id/photos", signalementController.listPhotos);

router.get('/api/posts', verifyToken, PostsController.getPosts);

module.exports = router;