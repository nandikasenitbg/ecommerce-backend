const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { calculatePrices } = require('../utils/calcPrices');

// ─── @route   POST /api/orders ────────────────────────────────────────────────
// ─── @desc    Create a new order ──────────────────────────────────────────────
// ─── @access  Private ────────────────────────────────────────────────────────
const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items provided.');
  }

  if (!shippingAddress) {
    res.status(400);
    throw new Error('Shipping address is required.');
  }

  // Validate all products exist and have sufficient stock
  const validatedItems = await Promise.all(
    orderItems.map(async (item) => {
      const product = await Product.findById(item.product);

      if (!product) {
        throw new Error(`Product "${item.name}" not found.`);
      }

      if (product.countInStock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.countInStock}`
        );
      }

      return {
        product: product._id,
        name: product.name,
        image: product.images[0]?.url || '',
        price: product.price, // Use current DB price, not client-sent price
        quantity: item.quantity,
      };
    })
  );

  // Calculate prices server-side (never trust client-sent prices)
  const { itemsPrice, shippingPrice, taxPrice, totalPrice } =
    calculatePrices(validatedItems);

  const order = await Order.create({
    user: req.user._id,
    orderItems: validatedItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  });

  // Reduce stock for each ordered product
  await Promise.all(
    validatedItems.map(async (item) => {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { countInStock: -item.quantity },
      });
    })
  );

  // Clear user's cart after order is placed
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [], totalPrice: 0, totalItems: 0 }
  );

  sendSuccess(res, 201, order, 'Order placed successfully');
});

// ─── @route   GET /api/orders/my-orders ──────────────────────────────────────
// ─── @desc    Get current user's orders ───────────────────────────────────────
// ─── @access  Private ────────────────────────────────────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { user: req.user._id };
  if (req.query.status) filter.orderStatus = req.query.status;

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  sendPaginated(res, orders, page, Math.ceil(total / limit), total);
});

// ─── @route   GET /api/orders/:id ────────────────────────────────────────────
// ─── @desc    Get order by ID ─────────────────────────────────────────────────
// ─── @access  Private ────────────────────────────────────────────────────────
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (!order) {
    res.status(404);
    throw new Error('Order not found.');
  }

  // Users can only view their own orders; admins can view any
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to view this order.');
  }

  sendSuccess(res, 200, order);
});

// ─── @route   PUT /api/orders/:id/pay ────────────────────────────────────────
// ─── @desc    Mark order as paid ──────────────────────────────────────────────
// ─── @access  Private ────────────────────────────────────────────────────────
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found.');
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error('Order is already paid.');
  }

  // Store payment result from payment gateway
  order.isPaid = true;
  order.paidAt = new Date();
  order.orderStatus = 'processing';
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    updateTime: req.body.update_time,
    emailAddress: req.body.email_address,
    paymentMethod: req.body.paymentMethod || order.paymentMethod,
  };

  const updatedOrder = await order.save();
  sendSuccess(res, 200, updatedOrder, 'Order marked as paid');
});

// ─── @route   PUT /api/orders/:id/deliver ────────────────────────────────────
// ─── @desc    Mark order as delivered (admin) ─────────────────────────────────
// ─── @access  Private/Admin ──────────────────────────────────────────────────
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found.');
  }

  if (!order.isPaid) {
    res.status(400);
    throw new Error('Order must be paid before it can be delivered.');
  }

  order.isDelivered = true;
  order.deliveredAt = new Date();
  order.orderStatus = 'delivered';
  if (req.body.trackingNumber) {
    order.trackingNumber = req.body.trackingNumber;
  }

  const updatedOrder = await order.save();
  sendSuccess(res, 200, updatedOrder, 'Order marked as delivered');
});

// ─── @route   PUT /api/orders/:id/status ─────────────────────────────────────
// ─── @desc    Update order status (admin) ────────────────────────────────────
// ─── @access  Private/Admin ──────────────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber, notes } = req.body;

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found.');
  }

  order.orderStatus = status;

  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }

  if (status === 'cancelled') {
    // Restore stock if order cancelled
    await Promise.all(
      order.orderItems.map(async (item) => {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { countInStock: item.quantity },
        });
      })
    );
  }

  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (notes) order.notes = notes;

  const updatedOrder = await order.save();
  sendSuccess(res, 200, updatedOrder, `Order status updated to ${status}`);
});

// ─── @route   GET /api/orders ─────────────────────────────────────────────────
// ─── @desc    Get all orders (admin) ──────────────────────────────────────────
// ─── @access  Private/Admin ──────────────────────────────────────────────────
const getAllOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.isPaid !== undefined) filter.isPaid = req.query.isPaid === 'true';

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email');

  // Admin dashboard stats
  const stats = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalPrice' },
        totalOrders: { $sum: 1 },
        paidOrders: { $sum: { $cond: ['$isPaid', 1, 0] } },
      },
    },
  ]);

  sendSuccess(res, 200, {
    orders,
    stats: stats[0] || { totalRevenue: 0, totalOrders: 0, paidOrders: 0 },
    pagination: { page, pages: Math.ceil(total / limit), total },
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  updateOrderStatus,
  getAllOrders,
};
