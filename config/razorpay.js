const Razorpay = require('razorpay');

// Instantiate Razorpay with your keys
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpayInstance;