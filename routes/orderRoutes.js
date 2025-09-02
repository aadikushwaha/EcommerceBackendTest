const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrdersForUser,
    getAllOrders,
    updateOrderStatus
} = require('../controllers/orderController');

const { protect, adminOnly } = require('../middlewares/authMiddlewares');

// Customers create orders and see their orders
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getOrdersForUser);

// Admin can see all orders and update status
router.get('/', protect, adminOnly, getAllOrders);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
