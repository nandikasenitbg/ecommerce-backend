const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  updateOrderStatus,
  getAllOrders,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// All order routes require authentication
router.use(protect);

// ─── User Routes ──────────────────────────────────────────────────────────────
router.route('/').post(createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/pay', updateOrderToPaid);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get('/', protect, admin, getAllOrders);
router.put('/:id/deliver', protect, admin, updateOrderToDelivered);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
