const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User'); // 🔥 NEW: Needed to fetch the push token
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const { sendOrderReceipt } = require('../services/emailService');
const { sendPushNotification } = require('../utils/pushNotification'); // 🔥 NEW: Import Expo utility

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

// 2. Verify Payment Signature, Save Order, and Deduct Stock (ACID + Idempotent)
const verifyPaymentSignature = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderItems, shippingAddress, totalAmount } = req.body;

        const existingOrder = await Order.findOne({ razorpayPaymentId: razorpay_payment_id });
        if (existingOrder) {
            await session.abortTransaction();
            session.endSession();
            return res.status(200).json({ message: 'Payment already verified', order: existingOrder });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const MY_RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET;

        const expectedSignature = crypto
            .createHmac('sha256', MY_RAZORPAY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.error("Signature mismatch!");
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        const athleteId = req.user._id || req.user.userId || req.user.id;
        if (!athleteId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(401).json({ message: 'User authentication failed during checkout.' });
        }

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

        const createdOrder = await order.save({ session });

        for (const item of order.orderItems) {
            const product = await Product.findById(item.product || item.id || item._id).session(session);
            if (product) {
                const currentStock = product.stock !== undefined ? product.stock : (product.countInStock || 0);
                const updatedStock = Math.max(0, currentStock - Number(item.qty || 1));

                product.stock = updatedStock;
                product.countInStock = updatedStock;
                await product.save({ session });
            }
        }

        await session.commitTransaction();
        session.endSession();

        if (req.user && req.user.email) {
            sendOrderReceipt(req.user.email, req.user.name, createdOrder, razorpay_payment_id);
        }

        // 🔥 FIRE PUSH NOTIFICATION TO THE USER FOR SUCCESSFUL PAYMENT
        try {
            const user = await User.findById(athleteId);
            if (user && user.expoPushToken) {
                const title = "✅ Payment Successful!";
                const body = `We received your payment of ₹${totalAmount}. Your gear is getting ready to ship!`;
                await sendPushNotification(user.expoPushToken, title, body, { orderId: createdOrder._id });
            }
        } catch (pushErr) {
            console.error("Failed to send payment push notification:", pushErr);
        }

        res.status(200).json({ message: 'Payment verified successfully', order: createdOrder });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Razorpay Verify Error:', error.message);
        res.status(500).json({ message: 'Error verifying payment', error: error.message });
    }
};

// 3. Webhook Endpoint to catch background payment events directly from Razorpay
const razorpayWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        if (!webhookSecret) {
            console.warn("⚠️ RAZORPAY_WEBHOOK_SECRET is missing from .env");
            return res.status(200).send('OK');
        }

        const event = req.body.event;
        const paymentEntity = req.body.payload?.payment?.entity;

        if (!paymentEntity) return res.status(200).send('OK');

        const razorpayOrderId = paymentEntity.order_id;

        if (event === 'payment.captured') {
            const existingOrder = await Order.findOne({ razorpayOrderId: razorpayOrderId });

            if (existingOrder && existingOrder.paymentStatus !== 'Completed') {
                existingOrder.paymentStatus = 'Completed';
                existingOrder.razorpayPaymentId = paymentEntity.id;
                await existingOrder.save();
            } else if (!existingOrder) {
                console.error(`🚨 CRITICAL: Ghost Payment caught! Money received for Razorpay Order ${razorpayOrderId}, but order Items were not saved in DB. Amount: ₹${paymentEntity.amount / 100}`);
            }
        } else if (event === 'payment.failed') {
            const existingOrder = await Order.findOne({ razorpayOrderId: razorpayOrderId });
            if (existingOrder) {
                existingOrder.paymentStatus = 'Failed';
                await existingOrder.save();
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Webhook processing failed');
    }
};

module.exports = { createRazorpayOrder, verifyPaymentSignature, razorpayWebhook };