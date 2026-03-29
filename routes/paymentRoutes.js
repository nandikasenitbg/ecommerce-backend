const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  getPaymentConfig,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/config', getPaymentConfig);

// ─── Stripe Webhook (raw body required — handled in server.js) ────────────────
router.post('/webhook', handleWebhook);

// ─── Private ──────────────────────────────────────────────────────────────────
router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);

module.exports = router;
