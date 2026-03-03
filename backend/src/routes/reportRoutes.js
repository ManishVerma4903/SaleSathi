const express = require('express');
const router = express.Router();
const {
  getSummary,
  getDailyProfit,
  getCategoryProfit,
  getInventoryReport,
  getSalesTrends,
  getDashboard
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { reportValidators } = require('../middleware/validateMiddleware');

/**
 * Report Routes
 * Handles business analytics and reporting
 */

router.use(protect);

router.get('/summary', reportValidators.summary, getSummary);
router.get('/daily-profit', reportValidators.summary, getDailyProfit);
router.get('/category-profit', reportValidators.summary, getCategoryProfit);
router.get('/inventory', getInventoryReport);
router.get('/sales-trends', reportValidators.summary, getSalesTrends);
router.get('/dashboard', getDashboard);

module.exports = router;
