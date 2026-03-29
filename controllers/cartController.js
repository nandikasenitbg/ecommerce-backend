const asyncHandler = require('../middleware/asyncHandler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendSuccess } = require('../utils/apiResponse');

// ─── @route   GET /api/cart ───────────────────────────────────────────────────
// ─── @desc    Get logged-in user's cart ───────────────────────────────────────
// ─── @access  Private ────────────────────────────────────────────────────────
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.product',
    'name images price countInStock'
  );

  if (!cart) {
    // Return an empty cart structure instead of 404
    return sendSuccess(res, 200, {
      items: [],
      totalPrice: 0,
      totalItems: 0,
    });
  }

  sendSuccess(res, 200, cart);
});

// ─── @route   POST /api/cart ──────────────────────────────────────────────────
// ─── @desc    Add item to cart ────────────────────────────────────────────────
// ─── @access  Private ────────────────────────────────────────────────────────
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error('Product ID is required.');
  }

  const qty = Number(quantity);
  if (isNaN(qty) || qty < 1) {
    res.status(400);
    throw new Error('Quantity must be a positive number.');
  }

  // Verify product exists and has stock
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  if (product.countInStock < qty) {
    res.status(400);
    throw new Error(
      `Insufficient stock. Only ${product.countInStock} unit(s) available.`
    );
  }

  // Get or create the user's cart
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  // Check if item already in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    // Update quantity of existing item
    const newQty = cart.items[existingItemIndex].quantity + qty;
    if (newQty > product.countInStock) {
      res.status(400);
      throw new Error(
        `Cannot add ${qty} more. Only ${product.countInStock - cart.items[existingItemIndex].quantity} unit(s) can be added.`
      );
    }
    cart.items[existingItemIndex].quantity = newQty;
  } else {
    // Add new item to cart
    cart.items.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || '',
      price: product.price,
      countInStock: product.countInStock,
      quantity: qty,
    });
  }

  await cart.save();

  const populatedCart = await Cart.findById(cart._id).populate(
    'items.product',
    'name images price countInStock'
  );

  sendSuccess(res, 200, populatedCart, 'Item added to cart');
});

// ─── @route   PUT /api/cart/:itemId ──────────────────────────────────────────
// ─── @desc    Update cart item quantity ───────────────────────────────────────
// ─── @access  Private ────────────────────────────────────────────────────────
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const qty = Number(quantity);

  if (isNaN(qty) || qty < 1) {
    res.status(400);
    throw new Error('Quantity must be a positive number.');
  }

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error('Cart not found.');
  }

  const item = cart.items.id(req.params.itemId);

  if (!item) {
    res.status(404);
    throw new Error('Cart item not found.');
  }

  // Validate stock
  if (qty > item.countInStock) {
    res.status(400);
    throw new Error(
      `Insufficient stock. Only ${item.countInStock} unit(s) available.`
    );
  }

  item.quantity = qty;
  await cart.save();

  sendSuccess(res, 200, cart, 'Cart updated');
});

// ─── @route   DELETE /api/cart/:itemId ───────────────────────────────────────
// ─── @desc    Remove item from cart ───────────────────────────────────────────
// ─── @access  Private ────────────────────────────────────────────────────────
const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error('Cart not found.');
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error('Cart item not found.');
  }

  item.deleteOne();
  await cart.save();

  sendSuccess(res, 200, cart, 'Item removed from cart');
});

// ─── @route   DELETE /api/cart ────────────────────────────────────────────────
// ─── @desc    Clear entire cart ───────────────────────────────────────────────
// ─── @access  Private ────────────────────────────────────────────────────────
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return sendSuccess(res, 200, null, 'Cart is already empty');
  }

  cart.items = [];
  await cart.save();

  sendSuccess(res, 200, null, 'Cart cleared');
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
