const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSale,
  getSalesByDate,
  getSalesByPaymentMethod,
  getTodaysSales
} = require('../controllers/salesController');
const { protect } = require('../middleware/authMiddleware');
const { saleValidators, paginationValidators } = require('../middleware/validateMiddleware');

/**
 * Sales Routes
 * Handles sales transactions and reporting
 */

router.use(protect);

router.get('/today', getTodaysSales);
router.get('/by-date', getSalesByDate);
router.get('/by-payment', getSalesByPaymentMethod);

router
  .route('/')
  .get(paginationValidators, getSales)
  .post(saleValidators.create, createSale);

router.get('/:id', saleValidators.getById, getSale);

module.exports = router;
