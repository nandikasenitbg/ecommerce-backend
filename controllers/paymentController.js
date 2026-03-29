const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../models/Order');
const { sendSuccess } = require('../utils/apiResponse');

// ─── NOTE: Stripe is prepared but not fully integrated ────────────────────────
// ─── To activate: set STRIPE_SECRET_KEY in .env and uncomment stripe lines ───
// const Stripe = require('stripe');
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── @route   POST /api/payment/create-payment-intent ────────────────────────
// ─── @desc    Create Stripe PaymentIntent ─────────────────────────────────────
// ─── @access  Private ────────────────────────────────────────────────────────
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    res.status(400);
    throw new Error('Order ID is required.');
  }

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found.');
  }

  // Verify user owns this order
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized.');
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error('Order is already paid.');
  }

  // ── STRIPE INTEGRATION (uncomment when ready) ──────────────────────────
  /*
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.totalPrice * 100), // Stripe expects cents
    currency: 'usd',
    metadata: {
      orderId: order._id.toString(),
      userId: req.user._id.toString(),
    },
  });

  return sendSuccess(res, 200, {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: order.totalPrice,
    currency: 'usd',
  });
  */

  // ── MOCK RESPONSE (remove when Stripe is integrated) ──────────────────
  sendSuccess(res, 200, {
    clientSecret: `mock_secret_${Date.now()}`,
    paymentIntentId: `mock_pi_${Date.now()}`,
    amount: order.totalPrice,
    currency: 'usd',
    orderId: order._id,
    message: 'Stripe integration ready. Add STRIPE_SECRET_KEY to .env to activate.',
  });
});

// ─── @route   POST /api/payment/confirm ──────────────────────────────────────
// ─── @desc    Confirm payment and update order ────────────────────────────────
// ─── @access  Private ────────────────────────────────────────────────────────
const confirmPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentIntentId, paymentMethod } = req.body;

  if (!orderId) {
    res.status(400);
    throw new Error('Order ID is required.');
  }

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found.');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized.');
  }

  // ── STRIPE VERIFICATION (uncomment when ready) ─────────────────────────
  /*
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    res.status(400);
    throw new Error('Payment has not been completed.');
  }
  */

  // Update order as paid
  order.isPaid = true;
  order.paidAt = new Date();
  order.orderStatus = 'processing';
  order.paymentResult = {
    id: paymentIntentId || `mock_${Date.now()}`,
    status: 'succeeded',
    updateTime: new Date().toISOString(),
    emailAddress: req.user.email,
    paymentMethod: paymentMethod || order.paymentMethod,
  };

  const updatedOrder = await order.save();
  sendSuccess(res, 200, updatedOrder, 'Payment confirmed successfully');
});

// ─── @route   POST /api/payment/webhook ──────────────────────────────────────
// ─── @desc    Handle Stripe webhook events ────────────────────────────────────
// ─── @access  Public (Stripe signs the request) ───────────────────────────────
const handleWebhook = asyncHandler(async (req, res) => {
  // ── STRIPE WEBHOOK (uncomment when ready) ─────────────────────────────
  /*
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // Must be raw body (use express.raw() middleware for this route)
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    res.status(400);
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      await Order.findByIdAndUpdate(orderId, {
        isPaid: true,
        paidAt: new Date(),
        orderStatus: 'processing',
        paymentResult: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          updateTime: new Date().toISOString(),
        },
      });
      break;
    }
    case 'payment_intent.payment_failed': {
      console.log('Payment failed:', event.data.object.id);
      break;
    }
    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
  }
  */

  // Acknowledge receipt immediately (Stripe requires fast 200 response)
  res.status(200).json({ received: true });
});

// ─── @route   GET /api/payment/config ────────────────────────────────────────
// ─── @desc    Get Stripe publishable key (safe to expose to frontend) ─────────
// ─── @access  Public ─────────────────────────────────────────────────────────
const getPaymentConfig = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
    currency: 'usd',
  });
});

module.exports = {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  getPaymentConfig,
};
