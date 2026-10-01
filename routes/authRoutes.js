const express = require('express');
const router = express.Router();

const {
    sendOtp,
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    verifyOtp,
    updateUserProfile,
    syncUserData,
    getUserData,
    savePushToken // 🔥 REPAIRED: Added the missing import!
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

router.post('/send-otp', sendOtp);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-otp', verifyOtp);
router.put('/profile', protect, updateUserProfile);

// Endpoints for Cross-Device Sync & Notifications
router.post('/sync', protect, syncUserData);
router.get('/data', protect, getUserData);
router.post('/push-token', protect, savePushToken);

module.exports = router;