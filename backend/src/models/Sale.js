const mongoose = require('mongoose');

/**
 * Sale Schema
 * Represents individual sales transactions with product references
 */
const saleSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 0,
    min: [0, 'Quantity cannot be negative']
  },
  weight: {
    type: Number,
    default: 0,
    min: [0, 'Weight cannot be negative']
  },
  weightUnit: {
    type: String,
    enum: ['g', 'kg', 'mg', 'oz', 'tola'],
    default: 'g'
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: [0, 'Purchase price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  costOfGoodsSold: {
    type: Number,
    required: true,
    min: [0, 'Cost of goods sold cannot be negative']
  },
  grossProfit: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['cash', 'card', 'upi'],
      message: 'Payment method must be cash, card, or upi'
    }
  },
  customerName: {
    type: String,
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  }
}, {
  timestamps: true
});

saleSchema.index({ createdAt: -1 });
saleSchema.index({ product: 1 });
saleSchema.index({ paymentMethod: 1 });
saleSchema.index({ createdBy: 1 });
saleSchema.index({ createdAt: 1, product: 1 });

/**
 * Pre-save hook to calculate totals
 */
saleSchema.pre('save', function(next) {
  this.totalAmount = this.sellingPrice * this.quantity;
  this.costOfGoodsSold = this.purchasePrice * this.quantity;
  this.grossProfit = this.totalAmount - this.costOfGoodsSold;
  next();
});

/**
 * Static method to get sales summary for date range
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<Object>} - Sales summary
 */
saleSchema.statics.getSalesSummary = async function(startDate, endDate) {
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
        totalSales: { $sum: '$totalAmount' },
        totalCOGS: { $sum: '$costOfGoodsSold' },
        totalGrossProfit: { $sum: '$grossProfit' },
        totalTransactions: { $sum: 1 },
        totalQuantitySold: { $sum: '$quantity' }
      }
    }
  ]);
  
  return summary[0] || {
    totalSales: 0,
    totalCOGS: 0,
    totalGrossProfit: 0,
    totalTransactions: 0,
    totalQuantitySold: 0
  };
};

/**
 * Static method to get top selling products
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @param {number} limit - Number of products to return
 * @returns {Promise<Array>} - Top selling products
 */
saleSchema.statics.getTopSellingProducts = async function(startDate, endDate, limit = 5) {
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
        _id: '$product',
        productName: { $first: '$productName' },
        totalQuantity: { $sum: '$quantity' },
        totalRevenue: { $sum: '$totalAmount' },
        totalProfit: { $sum: '$grossProfit' }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('Sale', saleSchema);
