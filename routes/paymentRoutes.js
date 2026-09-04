const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPaymentSignature } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware'); // THE FIX: This grabs your logged-in ID!

// BOTH routes must be protected so they know it is Gokul Krishna ordering!
router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyPaymentSignature);

module.exports = router;