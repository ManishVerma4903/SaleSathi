require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');

/**
 * Seed Script
 * Populates database with demo data for testing
 */

const users = [
  {
    name: 'Shop Owner',
    email: 'owner@shopms.com',
    password: 'owner123',
    role: 'owner'
  },
  {
    name: 'Staff Member',
    email: 'staff@shopms.com',
    password: 'staff123',
    role: 'staff'
  }
];

const products = [
  {
    name: 'iPhone 15 Pro',
    category: 'Electronics',
    purchasePrice: 999,
    sellingPrice: 1199,
    quantity: 25,
    minStockLevel: 5,
    supplier: 'Apple Inc.',
    description: 'Latest iPhone with A17 Pro chip'
  },
  {
    name: 'Samsung Galaxy S24',
    category: 'Electronics',
    purchasePrice: 799,
    sellingPrice: 999,
    quantity: 30,
    minStockLevel: 5,
    supplier: 'Samsung Electronics',
    description: 'Flagship Android smartphone'
  },
  {
    name: 'MacBook Air M3',
    category: 'Electronics',
    purchasePrice: 1099,
    sellingPrice: 1299,
    quantity: 15,
    minStockLevel: 3,
    supplier: 'Apple Inc.',
    description: '13.6-inch laptop with M3 chip'
  },
  {
    name: 'Sony WH-1000XM5',
    category: 'Audio',
    purchasePrice: 250,
    sellingPrice: 349,
    quantity: 40,
    minStockLevel: 10,
    supplier: 'Sony Corporation',
    description: 'Premium noise-canceling headphones'
  },
  {
    name: 'Apple AirPods Pro 2',
    category: 'Audio',
    purchasePrice: 180,
    sellingPrice: 249,
    quantity: 50,
    minStockLevel: 15,
    supplier: 'Apple Inc.',
    description: 'Wireless earbuds with ANC'
  },
  {
    name: 'iPad Pro 12.9"',
    category: 'Electronics',
    purchasePrice: 899,
    sellingPrice: 1099,
    quantity: 20,
    minStockLevel: 5,
    supplier: 'Apple Inc.',
    description: 'Professional tablet with M2 chip'
  },
  {
    name: 'Logitech MX Master 3S',
    category: 'Accessories',
    purchasePrice: 60,
    sellingPrice: 99,
    quantity: 60,
    minStockLevel: 20,
    supplier: 'Logitech',
    description: 'Wireless productivity mouse'
  },
  {
    name: 'Dell UltraSharp 27"',
    category: 'Electronics',
    purchasePrice: 350,
    sellingPrice: 449,
    quantity: 12,
    minStockLevel: 3,
    supplier: 'Dell Technologies',
    description: '4K USB-C monitor'
  },
  {
    name: 'USB-C Hub 10-in-1',
    category: 'Accessories',
    purchasePrice: 25,
    sellingPrice: 49,
    quantity: 100,
    minStockLevel: 25,
    supplier: 'Anker',
    description: 'Multi-port USB-C adapter'
  },
  {
    name: 'Mechanical Keyboard',
    category: 'Accessories',
    purchasePrice: 80,
    sellingPrice: 129,
    quantity: 35,
    minStockLevel: 10,
    supplier: 'Keychron',
    description: 'Wireless mechanical keyboard'
  },
  {
    name: 'Webcam HD Pro',
    category: 'Electronics',
    purchasePrice: 70,
    sellingPrice: 99,
    quantity: 45,
    minStockLevel: 15,
    supplier: 'Logitech',
    description: '1080p webcam for video calls'
  },
  {
    name: 'Portable SSD 1TB',
    category: 'Storage',
    purchasePrice: 80,
    sellingPrice: 119,
    quantity: 55,
    minStockLevel: 15,
    supplier: 'Samsung Electronics',
    description: 'Fast external SSD storage'
  },
  {
    name: 'Wireless Charger Stand',
    category: 'Accessories',
    purchasePrice: 20,
    sellingPrice: 39,
    quantity: 80,
    minStockLevel: 20,
    supplier: 'Belkin',
    description: '15W fast wireless charger'
  },
  {
    name: 'Smart Watch Pro',
    category: 'Wearables',
    purchasePrice: 200,
    sellingPrice: 299,
    quantity: 25,
    minStockLevel: 8,
    supplier: 'Samsung Electronics',
    description: 'Fitness tracking smartwatch'
  },
  {
    name: 'Bluetooth Speaker',
    category: 'Audio',
    purchasePrice: 45,
    sellingPrice: 79,
    quantity: 65,
    minStockLevel: 20,
    supplier: 'JBL',
    description: 'Portable waterproof speaker'
  }
];

const expenseCategories = [
  { category: 'Rent', description: 'Monthly shop rent', amount: 2500 },
  { category: 'Utilities', description: 'Electricity bill', amount: 350 },
  { category: 'Utilities', description: 'Internet service', amount: 100 },
  { category: 'Marketing', description: 'Social media advertising', amount: 500 },
  { category: 'Supplies', description: 'Packaging materials', amount: 150 },
  { category: 'Maintenance', description: 'AC repair', amount: 200 },
  { category: 'Salaries', description: 'Staff monthly salary', amount: 3000 },
  { category: 'Insurance', description: 'Shop insurance premium', amount: 400 },
  { category: 'Transportation', description: 'Delivery expenses', amount: 250 },
  { category: 'Miscellaneous', description: 'Office supplies', amount: 75 }
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\nClearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Sale.deleteMany({});
    await Expense.deleteMany({});
    console.log('Existing data cleared');

    console.log('\nSeeding users...');
    const createdUsers = [];
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`  Created user: ${user.email} (${user.role})`);
    }

    console.log('\nSeeding products...');
    const createdProducts = [];
    for (const productData of products) {
      const product = await Product.create(productData);
      createdProducts.push(product);
      console.log(`  Created product: ${product.name}`);
    }

    console.log('\nSeeding expenses...');
    const owner = createdUsers.find(u => u.role === 'owner');
    for (const expenseData of expenseCategories) {
      const expense = await Expense.create({
        ...expenseData,
        createdBy: owner._id,
        paymentMethod: ['cash', 'card', 'bank_transfer'][Math.floor(Math.random() * 3)]
      });
      console.log(`  Created expense: ${expense.category} - $${expense.amount}`);
    }

    console.log('\nSeeding sample sales...');
    const paymentMethods = ['cash', 'card', 'upi'];
    const saleCount = 20;
    
    for (let i = 0; i < saleCount; i++) {
      const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      
      if (randomProduct.quantity >= quantity) {
        const sale = await Sale.create({
          product: randomProduct._id,
          productName: randomProduct.name,
          quantity,
          purchasePrice: randomProduct.purchasePrice,
          sellingPrice: randomProduct.sellingPrice,
          totalAmount: randomProduct.sellingPrice * quantity,
          costOfGoodsSold: randomProduct.purchasePrice * quantity,
          grossProfit: (randomProduct.sellingPrice - randomProduct.purchasePrice) * quantity,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          createdBy: randomUser._id,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        });
        
        randomProduct.quantity -= quantity;
        await randomProduct.save();
        
        console.log(`  Created sale: ${sale.productName} x${sale.quantity} = $${sale.totalAmount}`);
      }
    }

    console.log('\n════════════════════════════════════════════');
    console.log('  Database seeded successfully!');
    console.log('════════════════════════════════════════════');
    console.log('\nDemo Accounts:');
    console.log('  Owner:');
    console.log('    Email: owner@shopms.com');
    console.log('    Password: owner123');
    console.log('\n  Staff:');
    console.log('    Email: staff@shopms.com');
    console.log('    Password: staff123');
    console.log('\n════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
