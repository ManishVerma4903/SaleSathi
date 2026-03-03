const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const { calculateProfit, calculateDailyProfit, calculateProfitByCategory } = require('../utils/profitCalculator');
const { asyncHandler } = require('../middleware/errorMiddleware');

/**
 * @desc    Get comprehensive business summary report
 * @route   GET /api/reports/summary
 * @access  Private
 */
const getSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const mongoose = require('mongoose');
  const userId = req.user.id;
  
  const dateMatch = { createdBy: new mongoose.Types.ObjectId(userId) };
  if (startDate || endDate) {
    dateMatch.createdAt = {};
    if (startDate) dateMatch.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateMatch.createdAt.$lte = end;
    }
  }
  
  const topSellingProducts = await Sale.aggregate([
    { $match: dateMatch },
    {
      $group: {
        _id: '$product',
        productName: { $first: '$productName' },
        totalQuantity: { $sum: '$quantity' },
        totalRevenue: { $sum: '$totalAmount' },
        totalProfit: { $sum: '$grossProfit' }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 5 }
  ]);
  
  const lowStockProducts = await Product.find({
    isActive: true,
    createdBy: userId,
    $or: [
      { quantity: { $gt: 0 }, $expr: { $lte: ['$quantity', '$minStockLevel'] } },
      { weight: { $gt: 0 }, minWeightLevel: { $gt: 0 }, $expr: { $lte: ['$weight', '$minWeightLevel'] } }
    ]
  });
  
  const expensesByCategory = await Expense.aggregate([
    { $match: { createdBy: new mongoose.Types.ObjectId(userId), ...(dateMatch.createdAt ? { createdAt: dateMatch.createdAt } : {}) } },
    { $group: { _id: '$category', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { totalAmount: -1 } }
  ]);
  
  const [profitData] = await Promise.all([
    calculateProfit(startDate, endDate, userId)
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      dateRange: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      },
      financials: {
        totalSales: profitData.totalSales,
        totalExpenses: profitData.totalExpenses,
        costOfGoodsSold: profitData.totalCostOfGoodsSold,
        grossProfit: profitData.grossProfit,
        netProfit: profitData.netProfit,
        grossMargin: profitData.grossMargin,
        profitMargin: profitData.profitMargin
      },
      transactions: {
        totalSalesTransactions: profitData.totalTransactions,
        totalExpenseTransactions: profitData.totalExpenseTransactions,
        totalItemsSold: profitData.totalItemsSold
      },
      topSellingProducts,
      lowStockProducts: {
        count: lowStockProducts.length,
        products: lowStockProducts.map(p => ({
          id: p._id,
          name: p.name,
          currentStock: p.quantity,
          minStockLevel: p.minStockLevel
        }))
      },
      expensesByCategory
    }
  });
});

/**
 * @desc    Get daily profit report
 * @route   GET /api/reports/daily-profit
 * @access  Private
 */
const getDailyProfit = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const dailyProfit = await calculateDailyProfit(startDate, endDate, req.user.id);
  
  const totals = dailyProfit.reduce(
    (acc, day) => ({
      totalRevenue: acc.totalRevenue + day.revenue,
      totalExpenses: acc.totalExpenses + day.expenses,
      totalNetProfit: acc.totalNetProfit + day.netProfit,
      totalTransactions: acc.totalTransactions + day.transactions
    }),
    { totalRevenue: 0, totalExpenses: 0, totalNetProfit: 0, totalTransactions: 0 }
  );
  
  res.status(200).json({
    success: true,
    data: {
      dailyBreakdown: dailyProfit,
      totals,
      daysCount: dailyProfit.length
    }
  });
});

/**
 * @desc    Get profit by product category
 * @route   GET /api/reports/category-profit
 * @access  Private
 */
const getCategoryProfit = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const categoryProfit = await calculateProfitByCategory(startDate, endDate, req.user.id);
  
  res.status(200).json({
    success: true,
    data: { categoryProfit }
  });
});

/**
 * @desc    Get inventory valuation report
 * @route   GET /api/reports/inventory
 * @access  Private
 */
const getInventoryReport = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const userId = req.user.id;
  
  const inventoryStats = await Product.aggregate([
    { $match: { isActive: true, createdBy: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalItems: { $sum: '$quantity' },
        totalCostValue: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
        totalRetailValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } },
        averagePurchasePrice: { $avg: '$purchasePrice' },
        averageSellingPrice: { $avg: '$sellingPrice' }
      }
    }
  ]);
  
  const categoryBreakdown = await Product.aggregate([
    { $match: { isActive: true, createdBy: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$category',
        productCount: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        costValue: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
        retailValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } }
      }
    },
    { $sort: { retailValue: -1 } }
  ]);
  
  const lowStockCount = await Product.countDocuments({
    isActive: true,
    createdBy: userId,
    $expr: { $lte: ['$quantity', '$minStockLevel'] }
  });
  
  const outOfStockCount = await Product.countDocuments({
    isActive: true,
    createdBy: userId,
    quantity: 0
  });
  
  const stats = inventoryStats[0] || {
    totalProducts: 0,
    totalItems: 0,
    totalCostValue: 0,
    totalRetailValue: 0,
    averagePurchasePrice: 0,
    averageSellingPrice: 0
  };
  
  res.status(200).json({
    success: true,
    data: {
      summary: {
        ...stats,
        potentialProfit: stats.totalRetailValue - stats.totalCostValue,
        lowStockCount,
        outOfStockCount
      },
      categoryBreakdown
    }
  });
});

/**
 * @desc    Get sales trends report
 * @route   GET /api/reports/sales-trends
 * @access  Private
 */
const getSalesTrends = asyncHandler(async (req, res) => {
  const { period = 'daily', startDate, endDate } = req.query;
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
  
  let dateFormat;
  switch (period) {
    case 'weekly':
      dateFormat = '%Y-W%V';
      break;
    case 'monthly':
      dateFormat = '%Y-%m';
      break;
    case 'yearly':
      dateFormat = '%Y';
      break;
    default:
      dateFormat = '%Y-%m-%d';
  }
  
  const trends = await Sale.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: { format: dateFormat, date: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' },
        profit: { $sum: '$grossProfit' },
        transactions: { $sum: 1 },
        itemsSold: { $sum: '$quantity' },
        averageOrderValue: { $avg: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      period,
      trends
    }
  });
});

/**
 * @desc    Get dashboard overview data
 * @route   GET /api/reports/dashboard
 * @access  Private
 */
const getDashboard = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const userId = req.user.id;
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  lastDayOfMonth.setHours(23, 59, 59, 999);
  
  const [todaySales, todayExpenses, monthlyData, lowStock, recentSales] = await Promise.all([
    Sale.aggregate([
      { $match: { createdBy: userObjectId, createdAt: { $gte: today, $lt: tomorrow } } },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          profit: { $sum: '$grossProfit' },
          count: { $sum: 1 }
        }
      }
    ]),
    Expense.aggregate([
      { $match: { createdBy: userObjectId, createdAt: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    calculateProfit(firstDayOfMonth, lastDayOfMonth, userId),
    Product.countDocuments({
      isActive: true,
      createdBy: userId,
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    }),
    Sale.find({ createdBy: userId })
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      today: {
        sales: todaySales[0]?.total || 0,
        profit: todaySales[0]?.profit || 0,
        transactions: todaySales[0]?.count || 0,
        expenses: todayExpenses[0]?.total || 0
      },
      monthly: {
        sales: monthlyData.totalSales,
        expenses: monthlyData.totalExpenses,
        netProfit: monthlyData.netProfit,
        profitMargin: monthlyData.profitMargin
      },
      alerts: {
        lowStockProducts: lowStock
      },
      recentSales: recentSales.map(s => ({
        id: s._id,
        product: s.productName,
        amount: s.totalAmount,
        date: s.createdAt
      }))
    }
  });
});

module.exports = {
  getSummary,
  getDailyProfit,
  getCategoryProfit,
  getInventoryReport,
  getSalesTrends,
  getDashboard
};
