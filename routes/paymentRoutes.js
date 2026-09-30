const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPaymentSignature, razorpayWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Frontend API Routes
router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyPaymentSignature);

// Server-to-Server Webhook Route (No 'protect' middleware because Razorpay calls this, not the user)
router.post('/webhook', razorpayWebhook);

module.exports = router;