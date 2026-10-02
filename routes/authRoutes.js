const express = require('express');
const router = express.Router();

const passport = require('passport'); // 🔥 NEW: Import Passport
const jwt = require('jsonwebtoken');  // 🔥 NEW: Import JWT for stateless token generation

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
    savePushToken
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

// 🔥 NEW: Route to trigger the Google Login popup
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// 🔥 NEW: Callback route Google hits after the user approves login
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {

    // Generate your standard JWT for the authenticated user
    const token = jwt.sign(
        { userId: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    // Redirect back to your Vite frontend with the secure token attached in the URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/oauth-success?token=${token}`);
});

module.exports = router;