const asyncHandler = require('../middleware/asyncHandler');
const Product = require('../models/Product');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');

// ─── @route   GET /api/products ───────────────────────────────────────────────
// ─── @desc    Get all products with search, filter, pagination ────────────────
// ─── @access  Public ─────────────────────────────────────────────────────────
const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  // ── Build query filters ────────────────────────────────────────────────
  const filter = {};

  // Text search (name, description, brand)
  if (req.query.keyword) {
    filter.$text = { $search: req.query.keyword };
  }

  // Category filter
  if (req.query.category) {
    filter.category = req.query.category;
  }

  // Brand filter
  if (req.query.brand) {
    filter.brand = { $regex: req.query.brand, $options: 'i' };
  }

  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }

  // Rating filter
  if (req.query.minRating) {
    filter.rating = { $gte: Number(req.query.minRating) };
  }

  // In stock only
  if (req.query.inStock === 'true') {
    filter.countInStock = { $gt: 0 };
  }

  // Featured filter
  if (req.query.featured === 'true') {
    filter.isFeatured = true;
  }

  // ── Build sort ─────────────────────────────────────────────────────────
  let sort = { createdAt: -1 }; // Default: newest first

  if (req.query.sort) {
    const sortMap = {
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      'rating-desc': { rating: -1 },
      'newest': { createdAt: -1 },
      'oldest': { createdAt: 1 },
    };
    sort = sortMap[req.query.sort] || sort;
  }

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email');

  sendPaginated(res, products, page, Math.ceil(total / limit), total);
});

// ─── @route   GET /api/products/featured ─────────────────────────────────────
// ─── @desc    Get featured products (for homepage) ───────────────────────────
// ─── @access  Public ─────────────────────────────────────────────────────────
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true }).limit(8);
  sendSuccess(res, 200, products);
});

// ─── @route   GET /api/products/top-rated ────────────────────────────────────
// ─── @desc    Get top-rated products ─────────────────────────────────────────
// ─── @access  Public ─────────────────────────────────────────────────────────
const getTopRatedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ rating: { $gte: 4 } })
    .sort({ rating: -1 })
    .limit(10);
  sendSuccess(res, 200, products);
});

// ─── @route   GET /api/products/categories ───────────────────────────────────
// ─── @desc    Get all distinct categories ────────────────────────────────────
// ─── @access  Public ─────────────────────────────────────────────────────────
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  sendSuccess(res, 200, categories);
});

// ─── @route   GET /api/products/:id ──────────────────────────────────────────
// ─── @desc    Get single product by ID ────────────────────────────────────────
// ─── @access  Public ─────────────────────────────────────────────────────────
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('user', 'name email')
    .populate('reviews.user', 'name avatar');

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  sendSuccess(res, 200, product);
});

// ─── @route   POST /api/products ─────────────────────────────────────────────
// ─── @desc    Create new product (admin) ──────────────────────────────────────
// ─── @access  Private/Admin ──────────────────────────────────────────────────
const createProduct = asyncHandler(async (req, res) => {
  const {
    name, description, price, images, category,
    brand, countInStock, isFeatured, discount,
  } = req.body;

  const product = await Product.create({
    name,
    description,
    price,
    images: images || [],
    category,
    brand,
    countInStock,
    isFeatured: isFeatured || false,
    discount: discount || 0,
    user: req.user._id,
    rating: 0,
    numReviews: 0,
  });

  sendSuccess(res, 201, product, 'Product created successfully');
});

// ─── @route   PUT /api/products/:id ──────────────────────────────────────────
// ─── @desc    Update product (admin) ──────────────────────────────────────────
// ─── @access  Private/Admin ──────────────────────────────────────────────────
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  const fields = [
    'name', 'description', 'price', 'images',
    'category', 'brand', 'countInStock', 'isFeatured', 'discount',
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  const updatedProduct = await product.save();
  sendSuccess(res, 200, updatedProduct, 'Product updated successfully');
});

// ─── @route   DELETE /api/products/:id ───────────────────────────────────────
// ─── @desc    Delete product (admin) ──────────────────────────────────────────
// ─── @access  Private/Admin ──────────────────────────────────────────────────
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  await product.deleteOne();
  sendSuccess(res, 200, null, 'Product deleted successfully');
});

// ─── @route   POST /api/products/:id/reviews ─────────────────────────────────
// ─── @desc    Add product review ──────────────────────────────────────────────
// ─── @access  Private ────────────────────────────────────────────────────────
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  if (!rating || !comment) {
    res.status(400);
    throw new Error('Rating and comment are required.');
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  // Check if user already reviewed this product
  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product.');
  }

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  product.reviews.push(review);

  // Recalculate aggregate rating and review count
  product.numReviews = product.reviews.length;
  product.rating =
    product.reviews.reduce((acc, r) => acc + r.rating, 0) /
    product.reviews.length;

  await product.save();
  sendSuccess(res, 201, null, 'Review added successfully');
});

// ─── @route   DELETE /api/products/:id/reviews/:reviewId ─────────────────────
// ─── @desc    Delete a review ─────────────────────────────────────────────────
// ─── @access  Private ────────────────────────────────────────────────────────
const deleteProductReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  const review = product.reviews.id(req.params.reviewId);

  if (!review) {
    res.status(404);
    throw new Error('Review not found.');
  }

  // Only the review author or admin can delete
  if (
    review.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this review.');
  }

  review.deleteOne();

  // Recalculate rating after deletion
  product.numReviews = product.reviews.length;
  product.rating =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) /
        product.reviews.length
      : 0;

  await product.save();
  sendSuccess(res, 200, null, 'Review deleted successfully');
});

module.exports = {
  getProducts,
  getFeaturedProducts,
  getTopRatedProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  deleteProductReview,
};
