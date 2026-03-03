const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');
const { asyncHandler, ApiError } = require('../middleware/errorMiddleware');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, shopName } = req.body;
  
  const existingUser = await User.findOne({ email });
  
  if (existingUser) {
    throw new ApiError('User with this email already exists', 400);
  }
  
  const userCount = await User.countDocuments();
  const userRole = userCount === 0 ? 'admin' : 'shop_owner';
  
  const userData = {
    name,
    email,
    password,
    role: userRole
  };
  
  if (userRole === 'shop_owner' && shopName) {
    userData.shopName = shopName;
  }
  
  const user = await User.create(userData);
  
  const token = generateToken(user._id);
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopName: user.shopName,
        createdAt: user.createdAt
      },
      token
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new ApiError('Invalid email or password', 401);
  }
  
  if (!user.isActive) {
    throw new ApiError('Your account has been deactivated. Please contact admin.', 401);
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    throw new ApiError('Invalid email or password', 401);
  }
  
  const token = generateToken(user._id);
  
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopName: user.shopName
      },
      token
    }
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, shopName } = req.body;
  const currentUser = await User.findById(req.user.id);
  
  const fieldsToUpdate = {};
  if (name) fieldsToUpdate.name = name;
  if (shopName !== undefined) fieldsToUpdate.shopName = shopName;
  
  // Only admin can change their own email, shop owners cannot
  if (email && currentUser.role === 'admin') {
    if (email !== currentUser.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError('Email already in use', 400);
      }
    }
    fieldsToUpdate.email = email;
  }
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = await User.findById(req.user.id).select('+password');
  
  const isMatch = await user.comparePassword(currentPassword);
  
  if (!isMatch) {
    throw new ApiError('Current password is incorrect', 401);
  }
  
  user.password = newPassword;
  await user.save();
  
  const token = generateToken(user._id);
  
  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    data: { token }
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};
