const Order = require('../models/Order');
const Product = require('../models/Product');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');

// 1. Create a Razorpay Order
const createRazorpayOrder = async (req, res) => {
    try {
        const { totalAmount } = req.body;

        const options = {
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        };

        const razorpayOrder = await razorpay.orders.create(options);

        res.status(201).json({
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        });

    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 2. Verify Payment Signature and Save Order
const verifyPaymentSignature = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderItems, shippingAddress, totalAmount } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        // 🔥 SECURITY FIX: Only use the environment variable! Make sure this is in your EC2 .env file.
        const MY_RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET;

        const expectedSignature = crypto
            .createHmac('sha256', MY_RAZORPAY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.error("Signature mismatch!");
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        const athleteId = req.user._id || req.user.userId || req.user.id;

        if (!athleteId) {
            return res.status(401).json({ message: 'User authentication failed during checkout.' });
        }

        // Create order in MongoDB
        const order = new Order({
            user: athleteId,
            orderItems,
            shippingAddress,
            totalAmount,
            paymentStatus: 'Completed',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature
        });

        const createdOrder = await order.save();

        // 🔥 THE FIX: Bulletproof Stock Deduction Logic!
        try {
            // Inside your Razorpay verify / order completion controller:
            for (const item of order.orderItems) {
                const product = await Product.findById(item.product || item.id || item._id);
                if (product) {
                    const currentStock = product.stock !== undefined ? product.stock : (product.countInStock || 0);

                    // Subtract ONLY the purchased quantity, avoiding negative stock
                    const updatedStock = Math.max(0, currentStock - Number(item.qty || 1));

                    product.stock = updatedStock;
                    product.countInStock = updatedStock;
                    await product.save();
                }
            }
        } catch (stockError) {
            console.error("Stock Deduction Warning:", stockError);
            // We only log this, we don't fail the payment if stock tracking glitches!
        }

        res.status(200).json({ message: 'Payment verified successfully', order: createdOrder });

    } catch (error) {
        console.error('Razorpay Verify Error:', error.message);
        res.status(500).json({ message: 'Error verifying payment', error: error.message });
    }
};

module.exports = { createRazorpayOrder, verifyPaymentSignature };