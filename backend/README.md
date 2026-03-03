# Shop Management System - Backend API

A production-ready RESTful API for managing shop operations including sales tracking, inventory management, expense tracking, and profit calculation.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (Owner/Staff)
- **Inventory Management**: Full CRUD operations with stock tracking and low-stock alerts
- **Sales Tracking**: Record sales with automatic inventory updates and profit calculation
- **Expense Management**: Track business expenses by category
- **Reports & Analytics**: Comprehensive business reports including profit margins, trends, and summaries
- **Security**: Helmet, CORS, rate limiting, input validation, and password hashing

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, helmet, express-rate-limit
- **Validation**: express-validator

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # Database connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── productController.js  # Product CRUD operations
│   │   ├── salesController.js    # Sales management
│   │   ├── expenseController.js  # Expense tracking
│   │   └── reportController.js   # Business analytics
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── roleMiddleware.js     # Role-based access
│   │   ├── errorMiddleware.js    # Error handling
│   │   └── validateMiddleware.js # Input validation
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Product.js            # Product schema
│   │   ├── Sale.js               # Sale schema
│   │   └── Expense.js            # Expense schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── salesRoutes.js
│   │   ├── expenseRoutes.js
│   │   └── reportRoutes.js
│   ├── seed/
│   │   └── seedData.js           # Demo data seeder
│   ├── utils/
│   │   └── profitCalculator.js   # Profit calculation logic
│   └── app.js                    # Express app configuration
├── server.js                     # Server entry point
├── .env.example                  # Environment template
├── package.json
└── README.md
```

## Installation

### Prerequisites

- Node.js v18 or higher
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/shop_management
   JWT_SECRET=your-secure-secret-key
   JWT_EXPIRE=7d
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

5. **Seed the database** (optional - adds demo data)
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode with hot reload
   npm run dev
   
   # Production mode
   npm start
   ```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All routes except `/api/auth/login` and `/api/auth/register` require authentication.

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

### Auth Endpoints

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "staff"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "staff"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
```

---

### Product Endpoints

#### Create Product
```http
POST /api/products
```

**Request Body:**
```json
{
  "name": "iPhone 15",
  "category": "Electronics",
  "purchasePrice": 999,
  "sellingPrice": 1199,
  "quantity": 50,
  "minStockLevel": 10,
  "supplier": "Apple Inc.",
  "description": "Latest iPhone model"
}
```

#### Get All Products
```http
GET /api/products?page=1&limit=10&search=iphone&category=Electronics&lowStock=true
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10, max: 100) |
| search | string | Search in name, category, supplier |
| category | string | Filter by category |
| minPrice | number | Minimum selling price |
| maxPrice | number | Maximum selling price |
| lowStock | boolean | Filter low stock items |
| sortBy | string | Sort field (default: createdAt) |
| sortOrder | string | asc or desc (default: desc) |

#### Get Single Product
```http
GET /api/products/:id
```

#### Update Product
```http
PUT /api/products/:id
```

#### Delete Product (Owner Only)
```http
DELETE /api/products/:id
```

#### Get Low Stock Products
```http
GET /api/products/low-stock
```

#### Get Categories
```http
GET /api/products/categories
```

#### Update Stock
```http
PATCH /api/products/:id/stock
```

**Request Body:**
```json
{
  "quantity": 10,
  "operation": "add"  // add, subtract, or set
}
```

---

### Sales Endpoints

#### Create Sale
```http
POST /api/sales
```

**Request Body:**
```json
{
  "product": "product_id_here",
  "quantity": 2,
  "paymentMethod": "card",
  "customerName": "Jane Smith",
  "notes": "Gift wrapped"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sale created successfully",
  "data": {
    "sale": {
      "_id": "...",
      "product": {...},
      "quantity": 2,
      "sellingPrice": 1199,
      "totalAmount": 2398,
      "costOfGoodsSold": 1998,
      "grossProfit": 400,
      "paymentMethod": "card"
    }
  },
  "warning": "Low stock alert: iPhone 15 has only 5 items left"
}
```

#### Get All Sales
```http
GET /api/sales?page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31&paymentMethod=card
```

#### Get Single Sale
```http
GET /api/sales/:id
```

#### Get Today's Sales
```http
GET /api/sales/today
```

#### Get Sales by Date Range
```http
GET /api/sales/by-date?startDate=2024-01-01&endDate=2024-01-31
```

#### Get Sales by Payment Method
```http
GET /api/sales/by-payment
```

---

### Expense Endpoints

#### Create Expense
```http
POST /api/expenses
```

**Request Body:**
```json
{
  "category": "Utilities",
  "description": "Monthly electricity bill",
  "amount": 350,
  "paymentMethod": "bank_transfer",
  "vendor": "Power Company"
}
```

#### Get All Expenses
```http
GET /api/expenses?page=1&limit=10&category=Utilities&startDate=2024-01-01
```

#### Get Single Expense
```http
GET /api/expenses/:id
```

#### Update Expense
```http
PUT /api/expenses/:id
```

#### Delete Expense
```http
DELETE /api/expenses/:id
```

#### Get Expenses by Category
```http
GET /api/expenses/by-category
```

#### Get Today's Expenses
```http
GET /api/expenses/today
```

---

### Report Endpoints

#### Get Summary Report
```http
GET /api/reports/summary?startDate=2024-01-01&endDate=2024-12-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dateRange": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    },
    "financials": {
      "totalSales": 50000,
      "totalExpenses": 15000,
      "costOfGoodsSold": 25000,
      "grossProfit": 25000,
      "netProfit": 10000,
      "grossMargin": 50,
      "profitMargin": 20
    },
    "transactions": {
      "totalSalesTransactions": 150,
      "totalExpenseTransactions": 45,
      "totalItemsSold": 300
    },
    "topSellingProducts": [...],
    "lowStockProducts": {...},
    "expensesByCategory": [...]
  }
}
```

#### Get Daily Profit
```http
GET /api/reports/daily-profit?startDate=2024-01-01&endDate=2024-01-31
```

#### Get Category Profit
```http
GET /api/reports/category-profit
```

#### Get Inventory Report
```http
GET /api/reports/inventory
```

#### Get Sales Trends
```http
GET /api/reports/sales-trends?period=monthly
```

**Query Parameters:**
| Parameter | Values |
|-----------|--------|
| period | daily, weekly, monthly, yearly |

#### Get Dashboard Data
```http
GET /api/reports/dashboard
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Demo Accounts

After running the seed script, you can use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@shopms.com | owner123 |
| Staff | staff@shopms.com | staff123 |

---

## Business Logic

### Profit Calculation

```
Gross Profit = Total Sales - Cost of Goods Sold (COGS)
Net Profit = Gross Profit - Total Expenses

COGS = Σ (Purchase Price × Quantity Sold)
Gross Margin = (Gross Profit / Total Sales) × 100
Profit Margin = (Net Profit / Total Sales) × 100
```

### Stock Management

- Stock automatically decreases when a sale is created
- Sales are prevented if requested quantity exceeds available stock
- Low stock alerts are triggered when quantity ≤ minStockLevel

---

## Security Features

1. **Password Hashing**: bcrypt with 12 salt rounds
2. **JWT Authentication**: Secure token-based auth with expiration
3. **Rate Limiting**: 100 requests per 15 minutes (10 for auth routes)
4. **Helmet**: Security headers
5. **CORS**: Configurable allowed origins
6. **Input Validation**: All inputs validated with express-validator
7. **Role-Based Access**: Owner-only operations protected

---

## Scripts

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Seed database with demo data
npm run seed
```

---

## License

ISC
