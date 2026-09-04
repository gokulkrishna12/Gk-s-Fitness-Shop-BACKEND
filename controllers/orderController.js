const Order = require('../models/Order');
const Product = require('../models/Product'); // 🔥 THE FIX: Needed to restore stock!

const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'email role').sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateOrderToDelivered = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.isDelivered = true;
        order.deliveredAt = Date.now();
        order.paymentStatus = 'Delivered';

        const updatedOrder = await order.save();
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.paymentStatus = req.body.paymentStatus;
        if (req.body.paymentStatus === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        }

        const updatedOrder = await order.save();
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const athleteId = req.user._id;
        if (!athleteId) return res.status(401).json({ message: "User not found in token" });

        const orders = await Order.find({ user: athleteId }).populate('user', 'email').sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server Error while fetching orders" });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'email');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const athleteId = req.user.userId || req.user._id || req.user.id;
        if (order.user._id.toString() !== athleteId.toString() && req.user.role !== 'admin' && !req.user.isAdmin && req.user.email !== 'gokuldinesh32@gmail.com') {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// USER manually cancels their order
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin && req.user.email !== 'gokuldinesh32@gmail.com') {
                return res.status(401).json({ message: 'Not authorized to cancel this order' });
            }

            // 🔥 THE FIX: Restore stock if the order wasn't already cancelled!
            if (order.paymentStatus !== 'Cancelled') {
                for (const item of order.orderItems) {
                    const productRecord = await Product.findById(item.product || item.id);
                    if (productRecord) {
                        const currentStock = productRecord.countInStock !== undefined ? productRecord.countInStock : (productRecord.stock || 0);
                        const newStock = currentStock + item.qty;
                        productRecord.countInStock = newStock;
                        productRecord.stock = newStock;
                        await productRecord.save();
                    }
                }
            }

            order.paymentStatus = 'Cancelled';
            order.cancelReason = req.body.reason || 'No reason provided';
            await order.save();
            res.json({ message: 'Order cancelled successfully. Stock Restored.' });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// ADMIN cancels the order
const adminCancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const isAdmin = req.user.isAdmin || req.user.role === 'admin' || req.user.email === 'gokuldinesh32@gmail.com';
        if (!isAdmin) return res.status(401).json({ message: 'Not authorized' });

        // 🔥 THE FIX: Restore stock for Admin Cancellations!
        if (order.paymentStatus !== 'Cancelled') {
            for (const item of order.orderItems) {
                const productRecord = await Product.findById(item.product || item.id);
                if (productRecord) {
                    const currentStock = productRecord.countInStock !== undefined ? productRecord.countInStock : (productRecord.stock || 0);
                    const newStock = currentStock + item.qty;
                    productRecord.countInStock = newStock;
                    productRecord.stock = newStock;
                    await productRecord.save();
                }
            }
        }

        order.paymentStatus = 'Cancelled';
        order.cancelReason = "Sorry, unfortunately cancelled by Admin. You can clear the history and order again. This order history can be deleted by Admin whenever, so you might not see it often.";

        await order.save();
        res.json({ message: 'Order cancelled by Admin. Stock Restored.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const isOwner = order.user && order.user.toString() === req.user._id.toString();
        const isAdmin = req.user.isAdmin || req.user.role === 'admin' || req.user.email === 'gokuldinesh32@gmail.com';

        if (!isOwner && !isAdmin) {
            return res.status(401).json({ message: 'Not authorized to delete this order' });
        }

        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Order removed from history' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
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