const Product = require('../models/Product');
const { asyncHandler, ApiError } = require('../middleware/errorMiddleware');

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private
 */
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    purchasePrice,
    sellingPrice,
    quantity,
    weight,
    weightUnit,
    purity,
    minStockLevel,
    minWeightLevel,
    supplier,
    description,
    sku
  } = req.body;
  
  if (sku) {
    const existingProduct = await Product.findOne({ sku, createdBy: req.user.id });
    if (existingProduct) {
      throw new ApiError('Product with this SKU already exists', 400);
    }
  }
  
  const product = await Product.create({
    name,
    category,
    purchasePrice,
    sellingPrice,
    quantity,
    weight,
    weightUnit,
    purity,
    minStockLevel,
    minWeightLevel,
    supplier,
    description,
    sku,
    createdBy: req.user.id
  });
  
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product }
  });
});

/**
 * @desc    Get all products with pagination and filtering
 * @route   GET /api/products
 * @access  Private
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    minPrice,
    maxPrice,
    lowStock,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  const query = { isActive: true, createdBy: req.user.id };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { supplier: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (category) {
    query.category = { $regex: category, $options: 'i' };
  }
  
  if (minPrice || maxPrice) {
    query.sellingPrice = {};
    if (minPrice) query.sellingPrice.$gte = parseFloat(minPrice);
    if (maxPrice) query.sellingPrice.$lte = parseFloat(maxPrice);
  }
  
  if (lowStock === 'true') {
    query.$expr = { $lte: ['$quantity', '$minStockLevel'] };
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  
  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit)),
    Product.countDocuments(query)
  ]);
  
  const totalPages = Math.ceil(total / parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: {
      products,
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
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Private
 */
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, createdBy: req.user.id });
  
  if (!product) {
    throw new ApiError('Product not found', 404);
  }
  
  res.status(200).json({
    success: true,
    data: { product }
  });
});

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private
 */
const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findOne({ _id: req.params.id, createdBy: req.user.id });
  
  if (!product) {
    throw new ApiError('Product not found', 404);
  }
  
  if (req.body.sku && req.body.sku !== product.sku) {
    const existingProduct = await Product.findOne({ sku: req.body.sku, createdBy: req.user.id });
    if (existingProduct) {
      throw new ApiError('Product with this SKU already exists', 400);
    }
  }
  
  product = await Product.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: { product }
  });
});

/**
 * @desc    Delete product (soft delete)
 * @route   DELETE /api/products/:id
 * @access  Private (Owner only)
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, createdBy: req.user.id });
  
  if (!product) {
    throw new ApiError('Product not found', 404);
  }
  
  product.isActive = false;
  await product.save();
  
  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

/**
 * @desc    Get low stock products
 * @route   GET /api/products/low-stock
 * @access  Private
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isActive: true,
    createdBy: req.user.id,
    $or: [
      { quantity: { $gt: 0 }, $expr: { $lte: ['$quantity', '$minStockLevel'] } },
      { weight: { $gt: 0 }, minWeightLevel: { $gt: 0 }, $expr: { $lte: ['$weight', '$minWeightLevel'] } }
    ]
  });
  
  res.status(200).json({
    success: true,
    data: {
      count: products.length,
      products
    }
  });
});

/**
 * @desc    Get product categories
 * @route   GET /api/products/categories
 * @access  Private
 */
const getCategories = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const categories = await Product.aggregate([
    { $match: { isActive: true, createdBy: new mongoose.Types.ObjectId(req.user.id) } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: { categories }
  });
});

/**
 * @desc    Update product stock
 * @route   PATCH /api/products/:id/stock
 * @access  Private
 */
const updateStock = asyncHandler(async (req, res) => {
  const { quantity, operation } = req.body;
  
  const product = await Product.findOne({ _id: req.params.id, createdBy: req.user.id });
  
  if (!product) {
    throw new ApiError('Product not found', 404);
  }
  
  if (operation === 'add') {
    product.quantity += parseInt(quantity);
  } else if (operation === 'subtract') {
    if (product.quantity < parseInt(quantity)) {
      throw new ApiError('Insufficient stock', 400);
    }
    product.quantity -= parseInt(quantity);
  } else {
    product.quantity = parseInt(quantity);
  }
  
  await product.save();
  
  res.status(200).json({
    success: true,
    message: 'Stock updated successfully',
    data: { product }
  });
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getCategories,
  updateStock
};
