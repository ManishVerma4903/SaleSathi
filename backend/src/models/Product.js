const mongoose = require('mongoose');

/**
 * Product Schema
 * Represents inventory items with pricing and stock management
 * Supports both quantity-based and weight-based tracking (for jewellery)
 */
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters'],
    default: 'General'
  },
  purchasePrice: {
    type: Number,
    min: [0, 'Purchase price cannot be negative'],
    default: 0
  },
  sellingPrice: {
    type: Number,
    min: [0, 'Selling price cannot be negative'],
    default: 0
  },
  quantity: {
    type: Number,
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative'],
    default: 0
  },
  weightUnit: {
    type: String,
    enum: {
      values: ['g', 'kg', 'mg', 'oz', 'tola'],
      message: 'Weight unit must be g, kg, mg, oz, or tola'
    },
    default: 'g'
  },
  purity: {
    type: String,
    trim: true,
    maxlength: [50, 'Purity cannot exceed 50 characters']
  },
  minStockLevel: {
    type: Number,
    default: 5,
    min: [0, 'Minimum stock level cannot be negative']
  },
  minWeightLevel: {
    type: Number,
    default: 0,
    min: [0, 'Minimum weight level cannot be negative']
  },
  supplier: {
    type: String,
    trim: true,
    maxlength: [200, 'Supplier name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  }
}, {
  timestamps: true
});

productSchema.index({ createdBy: 1 });

productSchema.index({ name: 'text', category: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ quantity: 1 });
productSchema.index({ createdAt: -1 });

/**
 * Virtual field to check if product is low on stock (quantity or weight)
 */
productSchema.virtual('isLowStock').get(function() {
  const lowQuantity = this.quantity > 0 && this.quantity <= this.minStockLevel;
  const lowWeight = this.weight > 0 && this.minWeightLevel > 0 && this.weight <= this.minWeightLevel;
  return lowQuantity || lowWeight;
});

/**
 * Virtual field to calculate profit margin
 */
productSchema.virtual('profitMargin').get(function() {
  if (!this.purchasePrice || !this.sellingPrice) return null;
  if (this.purchasePrice === 0) return 100;
  return ((this.sellingPrice - this.purchasePrice) / this.purchasePrice * 100).toFixed(2);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

/**
 * Static method to find low stock products (handles both quantity and weight)
 * @returns {Promise<Array>} - Array of low stock products
 */
productSchema.statics.findLowStock = function() {
  return this.find({
    isActive: true,
    $or: [
      { quantity: { $gt: 0 }, $expr: { $lte: ['$quantity', '$minStockLevel'] } },
      { weight: { $gt: 0 }, minWeightLevel: { $gt: 0 }, $expr: { $lte: ['$weight', '$minWeightLevel'] } }
    ]
  });
};

module.exports = mongoose.model('Product', productSchema);
