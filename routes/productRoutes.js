const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/top-rated', getTopRatedProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// ─── Private Routes ───────────────────────────────────────────────────────────
router.post('/:id/reviews', protect, createProductReview);
router.delete('/:id/reviews/:reviewId', protect, deleteProductReview);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.post('/', protect, admin, createProduct);
router
  .route('/:id')
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
