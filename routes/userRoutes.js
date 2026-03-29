const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// ─── Public Routes ────────────────────────────────────────────────────────────
router.post('/register', registerUser);
router.post('/login', loginUser);

// ─── Private Routes ───────────────────────────────────────────────────────────
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.route('/').get(protect, admin, getAllUsers);

router
  .route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router;
