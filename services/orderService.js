const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendPushNotification } = require('../utils/pushNotification'); // 🔥 Imported Utility

const checkIsAdmin = (user) => {
    return user.isAdmin || user.role === 'admin' || user.email === 'gokuldinesh32@gmail.com';
};

const restoreStock = async (order, session) => {
    if (order.paymentStatus !== 'Cancelled') {
        for (const item of order.orderItems) {
            const productRecord = await Product.findById(item.product || item.id).session(session);
            if (productRecord) {
                const currentStock = productRecord.countInStock !== undefined ? productRecord.countInStock : (productRecord.stock || 0);
                const newStock = currentStock + item.qty;
                productRecord.countInStock = newStock;
                productRecord.stock = newStock;
                await productRecord.save({ session });
            }
        }
    }
};

const getAllOrders = async () => {
    return await Order.find({}).populate('user', 'email role').sort({ createdAt: -1 });
};

const updateOrderToDelivered = async (orderId) => {
    const order = await Order.findById(orderId).populate('user');
    if (!order) throw { status: 404, message: 'Order not found' };

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.paymentStatus = 'Delivered';

    // Trigger Notification
    if (order.user && order.user.expoPushToken) {
        await sendPushNotification(
            order.user.expoPushToken,
            "Order Delivered ✅",
            "Your order has been delivered! Enjoy your gear.",
            { orderId: order._id, status: 'Delivered' }
        );
    }

    return await order.save();
};

const updateOrderStatus = async (orderId, paymentStatus) => {
    // 🔥 REPAIRED: Must populate('user') to access the push token!
    const order = await Order.findById(orderId).populate('user');
    if (!order) throw { status: 404, message: 'Order not found' };

    order.paymentStatus = paymentStatus;
    if (paymentStatus === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
    }

    // 🔥 REPAIRED: Automatically trigger push notification on Shipped or Delivered
    if ((paymentStatus === 'Shipped' || paymentStatus === 'Delivered') && order.user && order.user.expoPushToken) {
        await sendPushNotification(
            order.user.expoPushToken,
            "Order Update 📦",
            `Good news! Your order is now ${paymentStatus}.`,
            { orderId: order._id, status: paymentStatus }
        );
    }

    return await order.save();
};

const getUserOrders = async (user) => {
    const athleteId = user._id;
    if (!athleteId) throw { status: 401, message: "User not found in token" };

    return await Order.find({ user: athleteId }).populate('user', 'email').sort({ createdAt: -1 });
};

const getOrderById = async (orderId, user) => {
    const order = await Order.findById(orderId).populate('user', 'email');
    if (!order) throw { status: 404, message: 'Order not found' };

    const athleteId = user.userId || user._id || user.id;
    if (order.user._id.toString() !== athleteId.toString() && !checkIsAdmin(user)) {
        throw { status: 403, message: 'Not authorized to view this order' };
    }

    return order;
};

const cancelOrder = async (orderId, user, reason) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findById(orderId).session(session);
        if (!order) throw { status: 404, message: 'Order not found' };

        if (order.user.toString() !== user._id.toString() && !checkIsAdmin(user)) {
            throw { status: 401, message: 'Not authorized to cancel this order' };
        }

        await restoreStock(order, session);

        order.paymentStatus = 'Cancelled';
        order.cancelReason = reason || 'No reason provided';
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        return { message: 'Order cancelled successfully. Stock Restored safely.' };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const adminCancelOrder = async (orderId, user) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findById(orderId).session(session);
        if (!order) throw { status: 404, message: 'Order not found' };

        if (!checkIsAdmin(user)) {
            throw { status: 401, message: 'Not authorized' };
        }

        await restoreStock(order, session);

        order.paymentStatus = 'Cancelled';
        order.cancelReason = "Sorry, unfortunately cancelled by Admin. You can clear the history and order again. This order history can be deleted by Admin whenever, so you might not see it often.";
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        return { message: 'Order cancelled by Admin. Stock Restored safely.' };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const deleteOrder = async (orderId, user) => {
    const order = await Order.findById(orderId);
    if (!order) throw { status: 404, message: 'Order not found' };

    const isOwner = order.user && order.user.toString() === user._id.toString();

    if (!isOwner && !checkIsAdmin(user)) {
        throw { status: 401, message: 'Not authorized to delete this order' };
    }

    await Order.findByIdAndDelete(orderId);
    return { message: 'Order removed from history' };
};

module.exports = {
    getAllOrders,
    updateOrderToDelivered,
    updateOrderStatus,
    getUserOrders,
    getOrderById,
    cancelOrder,
    adminCancelOrder,
    deleteOrder
};