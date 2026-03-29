const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    countInStock: { type: Number, required: true },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One cart per user
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
    },
    totalItems: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ─── Middleware: Recalculate totals before saving ────────────────────────────
cartSchema.pre('save', function (next) {
  this.totalPrice = this.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  this.totalItems = this.items.reduce((acc, item) => acc + item.quantity, 0);

  // Round to 2 decimal places
  this.totalPrice = parseFloat(this.totalPrice.toFixed(2));
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
