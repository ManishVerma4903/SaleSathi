# SaleSathi - Shop Management Frontend

A modern, production-ready frontend for the Shop Management System built with Next.js 14, Tailwind CSS, and React.

## Features

- **Dashboard**: Real-time overview with charts and key metrics
- **Products**: Full inventory management with CRUD operations
- **Sales**: Record and track sales with automatic calculations
- **Expenses**: Track business expenses by category
- **Reports**: Comprehensive analytics with date filtering and CSV export
- **Settings**: User profile and preference management
- **Dark Mode**: Toggle between light and dark themes
- **Responsive**: Mobile-first design that works on all devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Forms**: React Hook Form
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── sales/
│   │   ├── expenses/
│   │   ├── reports/
│   │   ├── settings/
│   │   ├── login/
│   │   ├── layout.js
│   │   ├── page.js
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── layout/             # Layout components
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Navbar.jsx
│   │   │
│   │   └── ui/                 # Reusable UI components
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── Input.jsx
│   │       ├── Table.jsx
│   │       ├── Modal.jsx
│   │       └── Loader.jsx
│   │
│   ├── context/                # React Context providers
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.js
│   │   └── useDebounce.js
│   │
│   ├── services/               # API services
│   │   └── api.js
│   │
│   └── utils/                  # Utility functions
│       └── formatCurrency.js
│
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── jsconfig.json
├── package.json
└── README.md
```

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Backend API running (see backend README)

### Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```

4. **Update `.env.local`** if your backend runs on a different port:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   ```
   http://localhost:3000
   ```

## Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Pages Overview

### Login (`/login`)
- Email and password authentication
- Registration for new users
- Demo credentials displayed

### Dashboard (`/dashboard`)
- Today's sales, expenses, and profit
- Sales chart for last 7 days
- Monthly summary
- Low stock alerts
- Top selling products

### Products (`/products`)
- View all products with pagination
- Search by name, category, or supplier
- Filter by category
- Add new products
- Edit existing products
- Delete products (owner only)
- Stock status badges

### Sales (`/sales`)
- View all sales with pagination
- Filter by date range
- Filter by payment method
- Record new sales
- Auto-calculate totals
- Low stock warnings

### Expenses (`/expenses`)
- View all expenses with pagination
- Filter by date range
- Filter by category
- Add new expenses
- Delete expenses
- Category-wise breakdown

### Reports (`/reports`)
- Date range selection
- Quick filters (Today, Week, Month, Year)
- Summary cards (Sales, Expenses, Profit)
- Daily revenue & profit chart
- Category-wise profit pie chart
- Top selling products table
- Low stock alerts
- Expense breakdown
- CSV export

### Settings (`/settings`)
- Update profile (name, email)
- Change password
- Toggle dark mode
- Logout

## Authentication

The app uses JWT (JSON Web Token) for authentication:

1. User logs in with email/password
2. Backend returns JWT token
3. Token stored in localStorage
4. Token attached to all API requests
5. Auto-redirect to login on 401 errors

## Demo Credentials

After seeding the backend database:

| Role  | Email              | Password  |
|-------|--------------------|-----------|
| Owner | owner@shopms.com   | owner123  |
| Staff | staff@shopms.com   | staff123  |

## API Integration

The app connects to these backend endpoints:

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `PUT /api/auth/password`

### Products
- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/products/low-stock`
- `GET /api/products/categories`

### Sales
- `GET /api/sales`
- `POST /api/sales`
- `GET /api/sales/today`

### Expenses
- `GET /api/expenses`
- `POST /api/expenses`
- `DELETE /api/expenses/:id`

### Reports
- `GET /api/reports/summary`
- `GET /api/reports/dashboard`
- `GET /api/reports/daily-profit`
- `GET /api/reports/category-profit`

## Customization

### Colors

Edit `tailwind.config.js` to change the color scheme:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#3b82f6', // Change primary color
        600: '#2563eb',
        // ...
      }
    }
  }
}
```

### Currency

Edit `src/utils/formatCurrency.js` to change currency format:

```javascript
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

ISC
