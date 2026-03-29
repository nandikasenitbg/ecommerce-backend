const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendSuccess } = require('../utils/apiResponse');

// ─── Helper: Format user response (strips sensitive fields) ─────────────────
const formatUser = (user, token = null) => {
  const data = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    shippingAddresses: user.shippingAddresses,
    createdAt: user.createdAt,
  };
  if (token) data.token = token;
  return data;
};

// ─── @route   POST /api/users/register ───────────────────────────────────────
// ─── @desc    Register new user ───────────────────────────────────────────────
// ─── @access  Public ─────────────────────────────────────────────────────────
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password.');
  }

  // Check if email is already registered
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error('An account with this email already exists.');
  }

  // Create user (password hashing handled in model middleware)
  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  sendSuccess(res, 201, formatUser(user, token), 'Account created successfully');
});

// ─── @route   POST /api/users/login ──────────────────────────────────────────
// ─── @desc    Authenticate user and get token ─────────────────────────────────
// ─── @access  Public ─────────────────────────────────────────────────────────
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password.');
  }

  // Find user and explicitly select password (it's excluded by default)
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password'
  );

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password.');
  }

  // Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password.');
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error('Your account has been deactivated. Please contact support.');
  }

  const token = generateToken(user._id);
  sendSuccess(res, 200, formatUser(user, token), 'Login successful');
});

// ─── @route   GET /api/users/profile ─────────────────────────────────────────
// ─── @desc    Get logged-in user profile ──────────────────────────────────────
// ─── @access  Private ────────────────────────────────────────────────────────
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  sendSuccess(res, 200, formatUser(user));
});

// ─── @route   PUT /api/users/profile ─────────────────────────────────────────
// ─── @desc    Update user profile ─────────────────────────────────────────────
// ─── @access  Private ────────────────────────────────────────────────────────
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  // Only update fields that are provided
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.avatar = req.body.avatar || user.avatar;

  if (req.body.password) {
    if (req.body.password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters.');
    }
    user.password = req.body.password; // Will be hashed by pre-save middleware
  }

  const updatedUser = await user.save();
  const token = generateToken(updatedUser._id);

  sendSuccess(res, 200, formatUser(updatedUser, token), 'Profile updated successfully');
});

// ─── @route   GET /api/users ──────────────────────────────────────────────────
// ─── @desc    Get all users (admin) ───────────────────────────────────────────
// ─── @access  Private/Admin ──────────────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const total = await User.countDocuments();
  const users = await User.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  sendSuccess(res, 200, {
    users,
    pagination: { page, pages: Math.ceil(total / limit), total },
  });
});

// ─── @route   GET /api/users/:id ─────────────────────────────────────────────
// ─── @desc    Get user by ID (admin) ──────────────────────────────────────────
// ─── @access  Private/Admin ──────────────────────────────────────────────────
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  sendSuccess(res, 200, user);
});

// ─── @route   PUT /api/users/:id ─────────────────────────────────────────────
// ─── @desc    Update user (admin) ─────────────────────────────────────────────
// ─── @access  Private/Admin ──────────────────────────────────────────────────
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.role = req.body.role || user.role;
  user.isActive =
    req.body.isActive !== undefined ? req.body.isActive : user.isActive;

  const updatedUser = await user.save();
  sendSuccess(res, 200, formatUser(updatedUser), 'User updated successfully');
});

// ─── @route   DELETE /api/users/:id ──────────────────────────────────────────
// ─── @desc    Delete user (admin) ─────────────────────────────────────────────
// ─── @access  Private/Admin ──────────────────────────────────────────────────
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account.');
  }

  await user.deleteOne();
  sendSuccess(res, 200, null, 'User deleted successfully');
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
