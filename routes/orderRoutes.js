const express = require('express');
const router = express.Router();
const {
    getAllOrders,
    updateOrderToDelivered,
    updateOrderStatus,
    getUserOrders,
    getOrderById,
    cancelOrder,
    adminCancelOrder,
    deleteOrder
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// 1. ADMIN sees everything
router.route('/').get(protect, admin, getAllOrders);

// 2. USER strictly sees ONLY their own orders
// 🔥 THE FIX: Make sure this says getUserOrders, NOT getAllOrders!
router.route('/myorders').get(protect, getUserOrders);

// 3. Dynamic ID routes MUST be below specific routes like /myorders
router.route('/:id').get(protect, getOrderById);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/status').put(protect, admin, updateOrderStatus);
router.route('/:id/cancel').put(protect, cancelOrder);
router.route('/:id/admin-cancel').put(protect, admin, adminCancelOrder);
router.route('/:id').delete(protect, deleteOrder);

module.exports = router;