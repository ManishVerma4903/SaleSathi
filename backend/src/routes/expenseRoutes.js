const express = require('express');
const router = express.Router();
const {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  getExpensesByCategory,
  getCategories,
  getTodaysExpenses
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const { expenseValidators, paginationValidators } = require('../middleware/validateMiddleware');

/**
 * Expense Routes
 * Handles expense tracking and categorization
 */

router.use(protect);

router.get('/today', getTodaysExpenses);
router.get('/by-category', getExpensesByCategory);
router.get('/categories', getCategories);

router
  .route('/')
  .get(paginationValidators, getExpenses)
  .post(expenseValidators.create, createExpense);

router
  .route('/:id')
  .get(expenseValidators.getById, getExpense)
  .put(expenseValidators.getById, updateExpense)
  .delete(expenseValidators.getById, deleteExpense);

module.exports = router;
