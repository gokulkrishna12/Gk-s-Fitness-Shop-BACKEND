const orderService = require('../services/orderService');

const getAllOrders = async (req, res) => {
    try {
        const orders = await orderService.getAllOrders();
        res.status(200).json(orders);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server error', error: error.message });
    }
};

const updateOrderToDelivered = async (req, res) => {
    try {
        const updatedOrder = await orderService.updateOrderToDelivered(req.params.id);
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server error', error: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const updatedOrder = await orderService.updateOrderStatus(req.params.id, req.body.paymentStatus);
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server error', error: error.message });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const orders = await orderService.getUserOrders(req.user);
        res.status(200).json(orders);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || "Server Error while fetching orders" });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await orderService.getOrderById(req.params.id, req.user);
        res.status(200).json(order);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server error', error: error.message });
    }
};

// USER manually cancels their order
const cancelOrder = async (req, res) => {
    try {
        const result = await orderService.cancelOrder(req.params.id, req.user, req.body.reason);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// ADMIN cancels the order
const adminCancelOrder = async (req, res) => {
    try {
        const result = await orderService.adminCancelOrder(req.params.id, req.user);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const result = await orderService.deleteOrder(req.params.id, req.user);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
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