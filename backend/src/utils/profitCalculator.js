const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');

/**
 * Profit Calculator Utility
 * Calculates profit metrics for the shop
 * 
 * Profit Formula:
 * Net Profit = Total Sales Revenue - Total Expenses - Cost of Goods Sold (COGS)
 * 
 * Where:
 * - Total Sales Revenue = Sum of all sale amounts
 * - COGS = Sum of (purchasePrice * quantity) for all sold items
 * - Total Expenses = Sum of all recorded expenses
 */

/**
 * Calculate profit for a given date range
 * @param {Date|string} startDate - Start of period
 * @param {Date|string} endDate - End of period
 * @param {string} userId - User ID for filtering
 * @returns {Promise<Object>} - Profit calculation results
 */
const calculateProfit = async (startDate, endDate, userId) => {
  const dateFilter = {};
  
  if (startDate) {
    dateFilter.$gte = new Date(startDate);
  }
  
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }
  
  const salesMatch = { createdBy: new mongoose.Types.ObjectId(userId) };
  const expenseMatch = { createdBy: new mongoose.Types.ObjectId(userId) };
  
  if (Object.keys(dateFilter).length > 0) {
    salesMatch.createdAt = dateFilter;
    expenseMatch.createdAt = dateFilter;
  }
  
  const [salesData, expenseData] = await Promise.all([
    Sale.aggregate([
      { $match: salesMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalCOGS: { $sum: '$costOfGoodsSold' },
          totalGrossProfit: { $sum: '$grossProfit' },
          totalTransactions: { $sum: 1 },
          totalItemsSold: { $sum: '$quantity' }
        }
      }
    ]),
    Expense.aggregate([
      { $match: expenseMatch },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          expenseCount: { $sum: 1 }
        }
      }
    ])
  ]);
  
  const sales = salesData[0] || {
    totalRevenue: 0,
    totalCOGS: 0,
    totalGrossProfit: 0,
    totalTransactions: 0,
    totalItemsSold: 0
  };
  
  const expenses = expenseData[0] || {
    totalExpenses: 0,
    expenseCount: 0
  };
  
  const netProfit = sales.totalGrossProfit - expenses.totalExpenses;
  
  const profitMargin = sales.totalRevenue > 0 
    ? (netProfit / sales.totalRevenue * 100).toFixed(2) 
    : 0;
  
  const grossMargin = sales.totalRevenue > 0 
    ? (sales.totalGrossProfit / sales.totalRevenue * 100).toFixed(2) 
    : 0;
  
  return {
    totalSales: sales.totalRevenue,
    totalCostOfGoodsSold: sales.totalCOGS,
    grossProfit: sales.totalGrossProfit,
    totalExpenses: expenses.totalExpenses,
    netProfit,
    profitMargin: parseFloat(profitMargin),
    grossMargin: parseFloat(grossMargin),
    totalTransactions: sales.totalTransactions,
    totalItemsSold: sales.totalItemsSold,
    totalExpenseTransactions: expenses.expenseCount
  };
};

/**
 * Calculate daily profit breakdown
 * @param {Date|string} startDate - Start of period
 * @param {Date|string} endDate - End of period
 * @param {string} userId - User ID for filtering
 * @returns {Promise<Array>} - Daily profit breakdown
 */
const calculateDailyProfit = async (startDate, endDate, userId) => {
  const dateFilter = {};
  
  if (startDate) {
    dateFilter.$gte = new Date(startDate);
  }
  
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }
  
  const match = { createdBy: new mongoose.Types.ObjectId(userId) };
  if (Object.keys(dateFilter).length > 0) {
    match.createdAt = dateFilter;
  }
  
  const [dailySales, dailyExpenses] = await Promise.all([
    Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          cogs: { $sum: '$costOfGoodsSold' },
          grossProfit: { $sum: '$grossProfit' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          expenses: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);
  
  const expenseMap = new Map(
    dailyExpenses.map(e => [e._id, e.expenses])
  );
  
  return dailySales.map(day => {
    const expenses = expenseMap.get(day._id) || 0;
    return {
      date: day._id,
      revenue: day.revenue,
      cogs: day.cogs,
      grossProfit: day.grossProfit,
      expenses,
      netProfit: day.grossProfit - expenses,
      transactions: day.transactions
    };
  });
};

/**
 * Calculate profit by category
 * @param {Date|string} startDate - Start of period
 * @param {Date|string} endDate - End of period
 * @param {string} userId - User ID for filtering
 * @returns {Promise<Array>} - Profit by product category
 */
const calculateProfitByCategory = async (startDate, endDate, userId) => {
  const dateFilter = {};
  
  if (startDate) {
    dateFilter.$gte = new Date(startDate);
  }
  
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }
  
  const match = { createdBy: new mongoose.Types.ObjectId(userId) };
  if (Object.keys(dateFilter).length > 0) {
    match.createdAt = dateFilter;
  }
  
  return Sale.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $group: {
        _id: '$productInfo.category',
        revenue: { $sum: '$totalAmount' },
        cogs: { $sum: '$costOfGoodsSold' },
        grossProfit: { $sum: '$grossProfit' },
        itemsSold: { $sum: '$quantity' },
        transactions: { $sum: 1 }
      }
    },
    {
      $project: {
        category: '$_id',
        revenue: 1,
        cogs: 1,
        grossProfit: 1,
        itemsSold: 1,
        transactions: 1,
        profitMargin: {
          $cond: {
            if: { $eq: ['$revenue', 0] },
            then: 0,
            else: {
              $multiply: [
                { $divide: ['$grossProfit', '$revenue'] },
                100
              ]
            }
          }
        }
      }
    },
    { $sort: { grossProfit: -1 } }
  ]);
};

module.exports = {
  calculateProfit,
  calculateDailyProfit,
  calculateProfitByCategory
};
