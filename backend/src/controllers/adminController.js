const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const { asyncHandler, ApiError } = require('../middleware/errorMiddleware');

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getAdminStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalShopOwners, totalSalesData, recentUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'shop_owner' }),
    Sale.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]),
    User.find()
      .select('name email shopName role createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalShopOwners,
        totalSales: totalSalesData[0]?.totalSales || 0,
        totalRevenue: totalSalesData[0]?.totalRevenue || 0,
      },
      recentUsers
    }
  });
});

/**
 * @desc    Get all users with pagination
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, role } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { shopName: { $regex: search, $options: 'i' } }
    ];
  }

  if (role) {
    query.role = role;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }
  });
});

/**
 * @desc    Get single user stats
 * @route   GET /api/admin/users/:id/stats
 * @access  Private/Admin
 */
const getUserStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  const [salesData, totalProducts] = await Promise.all([
    Sale.aggregate([
      { $match: { createdBy: user._id } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]),
    Product.countDocuments({ createdBy: user._id })
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalProducts,
      totalSales: salesData[0]?.totalSales || 0
    }
  });
});

/**
 * @desc    Get single user details
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { user }
  });
});

/**
 * @desc    Update user details
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, shopName, password } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError('Email already in use', 400);
    }
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (shopName !== undefined) user.shopName = shopName;
  
  if (password) {
    user.password = password;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        role: user.role
      }
    }
  });
});

module.exports = {
  getAdminStats,
  getAllUsers,
  getUserStats,
  getUserDetails,
  updateUser
};
