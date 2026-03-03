const mongoose = require('mongoose');

/**
 * Expense Schema
 * Tracks business expenses with categories for reporting
 */
const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ['cash', 'card', 'upi', 'bank_transfer'],
      message: 'Invalid payment method'
    },
    default: 'cash'
  },
  receipt: {
    type: String,
    trim: true
  },
  vendor: {
    type: String,
    trim: true,
    maxlength: [200, 'Vendor name cannot exceed 200 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  }
}, {
  timestamps: true
});

expenseSchema.index({ createdAt: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ createdBy: 1 });
expenseSchema.index({ createdAt: 1, category: 1 });

/**
 * Static method to get expense summary for date range
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<Object>} - Expense summary
 */
expenseSchema.statics.getExpenseSummary = async function(startDate, endDate) {
  const match = {};
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  
  const summary = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' },
        totalTransactions: { $sum: 1 }
      }
    }
  ]);
  
  return summary[0] || { totalExpenses: 0, totalTransactions: 0 };
};

/**
 * Static method to get expenses grouped by category
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<Array>} - Expenses by category
 */
expenseSchema.statics.getExpensesByCategory = async function(startDate, endDate) {
  const match = {};
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
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
};

module.exports = mongoose.model('Expense', expenseSchema);
