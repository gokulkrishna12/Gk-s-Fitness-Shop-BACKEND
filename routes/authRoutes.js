const express = require('express');
const router = express.Router();

const {
    sendOtp,
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    updateUserProfile,
    syncUserData, // 🔥 Added Sync
    getUserData   // 🔥 Added Fetch
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

router.post('/send-otp', sendOtp);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/profile', protect, updateUserProfile);

// 🔥 THE FIX: New Endpoints for Cross-Device Sync!
router.post('/sync', protect, syncUserData);
router.get('/data', protect, getUserData);

module.exports = router;