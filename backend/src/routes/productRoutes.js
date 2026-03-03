const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getCategories,
  updateStock
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { productValidators, paginationValidators } = require('../middleware/validateMiddleware');

/**
 * Product Routes
 * Handles inventory management operations
 */

router.use(protect);

router.get('/low-stock', getLowStockProducts);
router.get('/categories', getCategories);

router
  .route('/')
  .get(paginationValidators, getProducts)
  .post(productValidators.create, createProduct);

router
  .route('/:id')
  .get(productValidators.getById, getProduct)
  .put(productValidators.update, updateProduct)
  .delete(productValidators.getById, authorize('shop_owner', 'admin'), deleteProduct);

router.patch('/:id/stock', productValidators.getById, updateStock);

module.exports = router;
