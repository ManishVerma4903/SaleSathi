const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation Result Handler
 * Checks for validation errors and returns appropriate response
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Authentication Validators
 */
const authValidators = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('shopName')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Shop name cannot exceed 200 characters'),
    validate
  ],
  
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required'),
    validate
  ]
};

/**
 * Product Validators
 */
const productValidators = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Product name is required')
      .isLength({ max: 200 }).withMessage('Product name cannot exceed 200 characters'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters'),
    body('purchasePrice')
      .optional()
      .isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
    body('sellingPrice')
      .optional()
      .isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
    body('quantity')
      .optional()
      .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('weight')
      .optional()
      .isFloat({ min: 0 }).withMessage('Weight must be a non-negative number'),
    body('weightUnit')
      .optional()
      .isIn(['g', 'kg', 'mg', 'oz', 'tola']).withMessage('Weight unit must be g, kg, mg, oz, or tola'),
    body('purity')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Purity cannot exceed 50 characters'),
    body('minStockLevel')
      .optional()
      .isInt({ min: 0 }).withMessage('Minimum stock level must be a non-negative integer'),
    body('minWeightLevel')
      .optional()
      .isFloat({ min: 0 }).withMessage('Minimum weight level must be a non-negative number'),
    body('supplier')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Supplier name cannot exceed 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    validate
  ],
  
  update: [
    param('id')
      .isMongoId().withMessage('Invalid product ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 }).withMessage('Product name must be between 1 and 200 characters'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters'),
    body('purchasePrice')
      .optional()
      .isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
    body('sellingPrice')
      .optional()
      .isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
    body('quantity')
      .optional()
      .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('weight')
      .optional()
      .isFloat({ min: 0 }).withMessage('Weight must be a non-negative number'),
    body('weightUnit')
      .optional()
      .isIn(['g', 'kg', 'mg', 'oz', 'tola']).withMessage('Weight unit must be g, kg, mg, oz, or tola'),
    body('purity')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Purity cannot exceed 50 characters'),
    body('minStockLevel')
      .optional()
      .isInt({ min: 0 }).withMessage('Minimum stock level must be a non-negative integer'),
    body('minWeightLevel')
      .optional()
      .isFloat({ min: 0 }).withMessage('Minimum weight level must be a non-negative number'),
    validate
  ],
  
  getById: [
    param('id')
      .isMongoId().withMessage('Invalid product ID'),
    validate
  ]
};

/**
 * Sale Validators
 */
const saleValidators = {
  create: [
    body('product')
      .notEmpty().withMessage('Product ID is required')
      .isMongoId().withMessage('Invalid product ID'),
    body('quantity')
      .notEmpty().withMessage('Quantity is required')
      .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('paymentMethod')
      .notEmpty().withMessage('Payment method is required')
      .isIn(['cash', 'card', 'upi']).withMessage('Payment method must be cash, card, or upi'),
    body('customerName')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Customer name cannot exceed 100 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
    validate
  ],
  
  getById: [
    param('id')
      .isMongoId().withMessage('Invalid sale ID'),
    validate
  ]
};

/**
 * Expense Validators
 */
const expenseValidators = {
  create: [
    body('category')
      .trim()
      .notEmpty().withMessage('Category is required')
      .isLength({ max: 100 }).withMessage('Category cannot exceed 100 characters'),
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('amount')
      .notEmpty().withMessage('Amount is required')
      .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('paymentMethod')
      .optional()
      .isIn(['cash', 'card', 'upi', 'bank_transfer']).withMessage('Invalid payment method'),
    body('vendor')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Vendor name cannot exceed 200 characters'),
    validate
  ],
  
  getById: [
    param('id')
      .isMongoId().withMessage('Invalid expense ID'),
    validate
  ]
};

/**
 * Report Validators
 */
const reportValidators = {
  summary: [
    query('startDate')
      .optional()
      .isISO8601().withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601().withMessage('End date must be a valid date'),
    validate
  ]
};

/**
 * Pagination Validators
 */
const paginationValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validate
];

module.exports = {
  validate,
  authValidators,
  productValidators,
  saleValidators,
  expenseValidators,
  reportValidators,
  paginationValidators
};
