const mongoose = require('mongoose');

// ─── Review Sub-Schema ──────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

// ─── Product Schema ─────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: '' },
      },
    ],
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      enum: [
        'Electronics',
        'Clothing',
        'Books',
        'Home & Garden',
        'Sports',
        'Toys',
        'Health & Beauty',
        'Automotive',
        'Food & Grocery',
        'Other',
      ],
    },
    brand: {
      type: String,
      required: [true, 'Product brand is required'],
      trim: true,
    },
    countInStock: {
      type: Number,
      required: [true, 'Count in stock is required'],
      min: [0, 'Stock count cannot be negative'],
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    reviews: [reviewSchema],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Discounted Price ───────────────────────────────────────────────
productSchema.virtual('discountedPrice').get(function () {
  if (this.discount > 0) {
    return parseFloat((this.price * (1 - this.discount / 100)).toFixed(2));
  }
  return this.price;
});

// ─── Index: for search and filtering performance ─────────────────────────────
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ rating: -1 });

module.exports = mongoose.model('Product', productSchema);
