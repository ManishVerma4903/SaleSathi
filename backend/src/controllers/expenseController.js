const Expense = require('../models/Expense');
const { asyncHandler, ApiError } = require('../middleware/errorMiddleware');

/**
 * @desc    Create a new expense
 * @route   POST /api/expenses
 * @access  Private
 */
const createExpense = asyncHandler(async (req, res) => {
  const { category, description, amount, paymentMethod, vendor, receipt } = req.body;
  
  const expense = await Expense.create({
    category,
    description,
    amount,
    paymentMethod,
    vendor,
    receipt,
    createdBy: req.user.id
  });
  
  await expense.populate('createdBy', 'name email');
  
  res.status(201).json({
    success: true,
    message: 'Expense recorded successfully',
    data: { expense }
  });
});

/**
 * @desc    Get all expenses with pagination and filtering
 * @route   GET /api/expenses
 * @access  Private
 */
const getExpenses = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    startDate,
    endDate,
    category,
    minAmount,
    maxAmount,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  const query = { createdBy: req.user.id };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }
  
  if (category) {
    query.category = { $regex: category, $options: 'i' };
  }
  
  if (minAmount || maxAmount) {
    query.amount = {};
    if (minAmount) query.amount.$gte = parseFloat(minAmount);
    if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  
  const [expenses, total, totalAmount] = await Promise.all([
    Expense.find(query)
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit)),
    Expense.countDocuments(query),
    Expense.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);
  
  const totalPages = Math.ceil(total / parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: {
      expenses,
      summary: {
        totalAmount: totalAmount[0]?.total || 0,
        totalTransactions: total
      },
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
 * @desc    Get single expense by ID
 * @route   GET /api/expenses/:id
 * @access  Private
 */
const getExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, createdBy: req.user.id })
    .populate('createdBy', 'name email');
  
  if (!expense) {
    throw new ApiError('Expense not found', 404);
  }
  
  res.status(200).json({
    success: true,
    data: { expense }
  });
});

/**
 * @desc    Update expense
 * @route   PUT /api/expenses/:id
 * @access  Private
 */
const updateExpense = asyncHandler(async (req, res) => {
  let expense = await Expense.findOne({ _id: req.params.id, createdBy: req.user.id });
  
  if (!expense) {
    throw new ApiError('Expense not found', 404);
  }
  
  expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.id },
    req.body,
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email');
  
  res.status(200).json({
    success: true,
    message: 'Expense updated successfully',
    data: { expense }
  });
});

/**
 * @desc    Delete expense
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, createdBy: req.user.id });
  
  if (!expense) {
    throw new ApiError('Expense not found', 404);
  }
  
  await expense.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'Expense deleted successfully'
  });
});

/**
 * @desc    Get expenses by category
 * @route   GET /api/expenses/by-category
 * @access  Private
 */
const getExpensesByCategory = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const mongoose = require('mongoose');
  
  const match = { createdBy: new mongoose.Types.ObjectId(req.user.id) };
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      match.createdAt.$lte = end;
    }
  }
  
  const expensesByCategory = await Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: { expensesByCategory }
  });
});

/**
 * @desc    Get expense categories list
 * @route   GET /api/expenses/categories
 * @access  Private
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Expense.distinct('category', { createdBy: req.user.id });
  
  res.status(200).json({
    success: true,
    data: { categories }
  });
});

/**
 * @desc    Get today's expenses
 * @route   GET /api/expenses/today
 * @access  Private
 */
const getTodaysExpenses = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [summary, expenses] = await Promise.all([
    Expense.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user.id),
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]),
    Expense.find({ createdBy: req.user.id, createdAt: { $gte: today, $lt: tomorrow } })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      summary: summary[0] || { totalExpenses: 0, transactionCount: 0 },
      expenses
    }
  });
});

module.exports = {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  getExpensesByCategory,
  getCategories,
  getTodaysExpenses
};
