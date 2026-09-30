const mongoose = require('mongoose'); // 🔥 Imported Mongoose for transactions
const Order = require('../models/Order');
const Product = require('../models/Product');

// Helper: Centralized Admin Verification
const checkIsAdmin = (user) => {
    return user.isAdmin || user.role === 'admin' || user.email === 'gokuldinesh32@gmail.com';
};

// Helper: Centralized Stock Restoration Logic (Now accepts a Transaction Session!)
const restoreStock = async (order, session) => {
    if (order.paymentStatus !== 'Cancelled') {
        for (const item of order.orderItems) {
            // 🔥 .session(session) ensures this query is part of the transaction
            const productRecord = await Product.findById(item.product || item.id).session(session);
            if (productRecord) {
                const currentStock = productRecord.countInStock !== undefined ? productRecord.countInStock : (productRecord.stock || 0);
                const newStock = currentStock + item.qty;
                productRecord.countInStock = newStock;
                productRecord.stock = newStock;
                // 🔥 .save({ session }) ties the save to the transaction
                await productRecord.save({ session });
            }
        }
    }
};

const getAllOrders = async () => {
    return await Order.find({}).populate('user', 'email role').sort({ createdAt: -1 });
};

const updateOrderToDelivered = async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order) throw { status: 404, message: 'Order not found' };

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.paymentStatus = 'Delivered';

    return await order.save();
};

const updateOrderStatus = async (orderId, paymentStatus) => {
    const order = await Order.findById(orderId);
    if (!order) throw { status: 404, message: 'Order not found' };

    order.paymentStatus = paymentStatus;
    if (paymentStatus === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
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

// 🔥 UPGRADED: User Cancel Order with ACID Transactions
const cancelOrder = async (orderId, user, reason) => {
    // 1. Start the transaction session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findById(orderId).session(session);
        if (!order) throw { status: 404, message: 'Order not found' };

        if (order.user.toString() !== user._id.toString() && !checkIsAdmin(user)) {
            throw { status: 401, message: 'Not authorized to cancel this order' };
        }

        // 2. Pass the session into the stock restorer
        await restoreStock(order, session);

        // 3. Update the order
        order.paymentStatus = 'Cancelled';
        order.cancelReason = reason || 'No reason provided';
        await order.save({ session });

        // 4. If EVERYTHING succeeded, commit the transaction to the database
        await session.commitTransaction();
        session.endSession();

        return { message: 'Order cancelled successfully. Stock Restored safely.' };
    } catch (error) {
        // 5. If ANYTHING failed, roll everything back instantly
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

// 🔥 UPGRADED: Admin Cancel Order with ACID Transactions
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