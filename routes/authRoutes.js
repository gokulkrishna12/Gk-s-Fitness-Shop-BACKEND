const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

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

// 🔥 FIX 1: Capture the mobile deep link and pass it to Google via 'state'
router.get('/google', (req, res, next) => {
    const redirectUri = req.query.redirect_uri || '';
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: redirectUri // Passes the mobile URL through the OAuth flow
    })(req, res, next);
});

// 🔥 FIX 2: Dynamic Redirect back to Web OR Mobile App
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {
    const token = jwt.sign(
        {
            userId: req.user._id,
            role: req.user.role,
            email: req.user.email,
            name: req.user.name
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    const userData = encodeURIComponent(JSON.stringify({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
    }));

    // Read the deep link we passed earlier
    const mobileRedirect = req.query.state;

    if (mobileRedirect) {
        // If request came from mobile, bounce them back into the app!
        res.redirect(`${mobileRedirect}?token=${token}&user=${userData}`);
    } else {
        // If request came from web, bounce them back to the React Vite frontend
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/oauth-success?token=${token}&user=${userData}`);
    }
});

module.exports = router;