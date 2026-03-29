const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String },
});

const paymentResultSchema = new mongoose.Schema({
  id: { type: String },               // Payment gateway transaction ID
  status: { type: String },           // e.g., "succeeded", "pending"
  updateTime: { type: String },
  emailAddress: { type: String },
  paymentMethod: { type: String },    // "stripe", "paypal", etc.
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: 'Order must have at least one item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['stripe', 'paypal', 'cod'],
      default: 'stripe',
    },
    paymentResult: paymentResultSchema,

    // ─── Price Breakdown ──────────────────────────────────────────
    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    // ─── Status Flags ─────────────────────────────────────────────
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,

    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,

    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },

    trackingNumber: {
      type: String,
      default: '',
    },

    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// ─── Index for efficient user order lookups ──────────────────────────────────
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
