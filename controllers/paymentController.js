const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const { sendOrderReceipt } = require('../services/emailService');
const { sendPushNotification } = require('../utils/pushNotification');

// 1. Create Razorpay Order AND Save Pending Order in DB
const createRazorpayOrder = async (req, res) => {
    try {
        // 🔥 FIX: We now collect cart details upfront to prevent data loss!
        const { totalAmount, orderItems, shippingAddress } = req.body;
        const athleteId = req.user._id || req.user.userId || req.user.id;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items provided' });
        }

        const options = {
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // 🔥 FIX: Lock in the order as Pending before the customer even pays
        const order = new Order({
            user: athleteId,
            orderItems,
            shippingAddress,
            totalAmount,
            paymentStatus: 'Pending',
            razorpayOrderId: razorpayOrder.id,
        });

        await order.save();

        res.status(201).json({
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            dbOrderId: order._id // Send DB ID back to frontend just in case
        });

    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 2. Verify Payment Signature, UPDATE Order, and Deduct Stock
const verifyPaymentSignature = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

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

        // 🔥 FIX: Find the existing Pending order instead of creating a new one
        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id }).session(session);

        if (!order) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Order not found in database' });
        }

        if (order.paymentStatus === 'Completed') {
            await session.abortTransaction();
            session.endSession();
            return res.status(200).json({ message: 'Payment already verified', order });
        }

        // Update status to Completed
        order.paymentStatus = 'Completed';
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;

        await order.save({ session });

        // Deduct stock safely
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
            sendOrderReceipt(req.user.email, req.user.name, order, razorpay_payment_id);
        }

        try {
            const user = await User.findById(order.user);
            if (user && user.expoPushToken) {
                const title = "✅ Payment Successful!";
                const body = `We received your payment of ₹${order.totalAmount}. Your gear is getting ready to ship!`;
                await sendPushNotification(user.expoPushToken, title, body, { orderId: order._id });
            }
        } catch (pushErr) {
            console.error("Failed to send payment push notification:", pushErr);
        }

        res.status(200).json({ message: 'Payment verified successfully', order });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Razorpay Verify Error:', error.message);
        res.status(500).json({ message: 'Error verifying payment', error: error.message });
    }
};

// 3. Robust Webhook Endpoint
const razorpayWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        if (!webhookSecret) return res.status(200).send('OK');

        const event = req.body.event;
        const paymentEntity = req.body.payload?.payment?.entity;
        if (!paymentEntity) return res.status(200).send('OK');

        const razorpayOrderId = paymentEntity.order_id;

        if (event === 'payment.captured') {
            const existingOrder = await Order.findOne({ razorpayOrderId: razorpayOrderId });

            if (existingOrder && existingOrder.paymentStatus !== 'Completed') {
                // 🔥 FIX: The webhook now acts as a failsafe! If the frontend crashes, the webhook secures the order.
                existingOrder.paymentStatus = 'Completed';
                existingOrder.razorpayPaymentId = paymentEntity.id;
                await existingOrder.save();
                console.log(`✅ Webhook Failsafe: Successfully finalized Order ${existingOrder._id}`);
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