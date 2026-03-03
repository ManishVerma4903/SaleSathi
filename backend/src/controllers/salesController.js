const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { asyncHandler, ApiError } = require('../middleware/errorMiddleware');

/**
 * Convert weight to grams for comparison
 */
const convertToGrams = (weight, unit) => {
  const conversions = {
    'g': 1,
    'kg': 1000,
    'mg': 0.001,
    'oz': 28.3495,
    'tola': 11.6638
  };
  return weight * (conversions[unit] || 1);
};

/**
 * Convert grams to target unit
 */
const convertFromGrams = (grams, targetUnit) => {
  const conversions = {
    'g': 1,
    'kg': 1000,
    'mg': 0.001,
    'oz': 28.3495,
    'tola': 11.6638
  };
  return grams / (conversions[targetUnit] || 1);
};

/**
 * @desc    Create a new sale
 * @route   POST /api/sales
 * @access  Private
 */
const createSale = asyncHandler(async (req, res) => {
  const { product: productId, quantity, weight, weightUnit, totalPrice, paymentMethod, customerName, notes } = req.body;

  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  if (!product.isActive) {
    throw new ApiError('This product is no longer available', 400);
  }

  const saleQty = Number(quantity) || 0;
  const saleWeight = Number(weight) || 0;
  const saleWeightUnit = weightUnit || 'g';

  if (saleQty > 0 && product.quantity < saleQty) {
    throw new ApiError(
      `Insufficient stock. Only ${product.quantity} items available`,
      400
    );
  }

  if (saleWeight > 0) {
    const saleWeightInGrams = convertToGrams(saleWeight, saleWeightUnit);
    const productWeightInGrams = convertToGrams(product.weight, product.weightUnit);
    
    if (productWeightInGrams < saleWeightInGrams) {
      throw new ApiError(
        `Insufficient weight. Only ${product.weight} ${product.weightUnit} available`,
        400
      );
    }
  }

  const totalAmount = Number(totalPrice);
  const purchasePrice = product.purchasePrice || 0;
  const costOfGoodsSold = saleQty > 0 ? purchasePrice * saleQty : 0;

  const sale = await Sale.create({
    product: productId,
    productName: product.name,
    quantity: saleQty,
    weight: saleWeight,
    weightUnit: saleWeightUnit,
    purchasePrice: purchasePrice,
    sellingPrice: saleQty > 0 ? totalAmount / saleQty : totalAmount,
    totalAmount: totalAmount,
    costOfGoodsSold: costOfGoodsSold,
    grossProfit: totalAmount - costOfGoodsSold,
    paymentMethod,
    customerName,
    notes,
    createdBy: req.user.id
  });

  if (saleQty > 0) {
    product.quantity -= saleQty;
  }
  if (saleWeight > 0) {
    const saleWeightInGrams = convertToGrams(saleWeight, saleWeightUnit);
    const productWeightInGrams = convertToGrams(product.weight, product.weightUnit);
    const remainingGrams = productWeightInGrams - saleWeightInGrams;
    product.weight = convertFromGrams(remainingGrams, product.weightUnit);
  }
  await product.save();

  await sale.populate([
    { path: 'product', select: 'name category' },
    { path: 'createdBy', select: 'name email' }
  ]);

  const response = {
    success: true,
    message: 'Sale created successfully',
    data: { sale }
  };

  if (product.quantity <= product.minStockLevel) {
    response.warning = `Low stock alert: ${product.name} has only ${product.quantity} items left`;
  }

  res.status(201).json(response);
});

/**
 * @desc    Get all sales with pagination and filtering
 * @route   GET /api/sales
 * @access  Private
 */
const getSales = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    startDate,
    endDate,
    paymentMethod,
    productId,
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

  if (paymentMethod) {
    query.paymentMethod = paymentMethod;
  }

  if (productId) {
    query.product = productId;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [sales, total] = await Promise.all([
    Sale.find(query)
      .populate('product', 'name category')
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit)),
    Sale.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / parseInt(limit));

  const totalAmount = await Sale.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      sales,
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
 * @desc    Get single sale by ID
 * @route   GET /api/sales/:id
 * @access  Private
 */
const getSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findOne({ _id: req.params.id, createdBy: req.user.id })
    .populate('product', 'name category sellingPrice')
    .populate('createdBy', 'name email');

  if (!sale) {
    throw new ApiError('Sale not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { sale }
  });
});

/**
 * @desc    Get sales by date range
 * @route   GET /api/sales/by-date
 * @access  Private
 */
const getSalesByDate = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const mongoose = require('mongoose');

  if (!startDate || !endDate) {
    throw new ApiError('Start date and end date are required', 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const salesByDay = await Sale.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(req.user.id),
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        totalSales: { $sum: '$totalAmount' },
        totalProfit: { $sum: '$grossProfit' },
        transactionCount: { $sum: 1 },
        itemsSold: { $sum: '$quantity' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: { salesByDay }
  });
});

/**
 * @desc    Get sales by payment method
 * @route   GET /api/sales/by-payment
 * @access  Private
 */
const getSalesByPaymentMethod = asyncHandler(async (req, res) => {
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

  const salesByPayment = await Sale.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$paymentMethod',
        totalAmount: { $sum: '$totalAmount' },
        transactionCount: { $sum: 1 },
        averageTransaction: { $avg: '$totalAmount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: { salesByPayment }
  });
});

/**
 * @desc    Get today's sales summary
 * @route   GET /api/sales/today
 * @access  Private
 */
const getTodaysSales = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [summary, recentSales] = await Promise.all([
    Sale.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user.id),
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalProfit: { $sum: '$grossProfit' },
          transactionCount: { $sum: 1 },
          itemsSold: { $sum: '$quantity' }
        }
      }
    ]),
    Sale.find({ createdBy: req.user.id, createdAt: { $gte: today, $lt: tomorrow } })
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: summary[0] || {
        totalSales: 0,
        totalProfit: 0,
        transactionCount: 0,
        itemsSold: 0
      },
      recentSales
    }
  });
});

module.exports = {
  createSale,
  getSales,
  getSale,
  getSalesByDate,
  getSalesByPaymentMethod,
  getTodaysSales
};
