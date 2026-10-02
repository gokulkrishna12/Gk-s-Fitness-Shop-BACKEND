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
// Inside your Google callback route:
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {

    // 🔥 FIX: Pull the live role directly from the database user object (req.user)
    const token = jwt.sign(
        {
            userId: req.user._id,
            role: req.user.role,   // <-- Pulls whatever role is currently set in MongoDB Atlas!
            email: req.user.email,
            name: req.user.name
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    // Pass both the token AND the updated user object to the frontend
    const userData = encodeURIComponent(JSON.stringify({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role // <-- Live role sent to frontend!
    }));

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/oauth-success?token=${token}&user=${userData}`);
});

module.exports = router;