const Order = require('../models/Order');
const Product = require('../models/Product'); // THE FIX: Need Product model to deduct stock!
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

        // PASTE YOUR REAL RAZORPAY SECRET HERE
        const MY_RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || "YrsnUkIynkCQvfDq1Cc2RoI0";

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

        // 🔥 THE FIX: Stock Deduction Logic!
        try {
            for (const item of orderItems) {
                const productRecord = await Product.findById(item.product || item.id);
                if (productRecord) {
                    // Reduce stock safely so it never drops below 0
                    const currentStock = productRecord.countInStock !== undefined ? productRecord.countInStock : productRecord.stock;
                    const newStock = Math.max(0, currentStock - item.qty);

                    productRecord.countInStock = newStock;
                    productRecord.stock = newStock; // Keep both updated just in case

                    await productRecord.save();
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