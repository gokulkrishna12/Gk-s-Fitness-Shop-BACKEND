const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'ci_dummy_razorpay_key_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'ci_dummy_razorpay_secret',
});

module.exports = razorpayInstance;