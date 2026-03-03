'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Layout } from '@/components/layout';
import { Card, StatCard, CardSkeleton, Badge } from '@/components/ui';
import { reportsAPI, productsAPI } from '@/services/api';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';
import { useAuth } from '@/context/AuthContext';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [salesTrends, setSalesTrends] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const { isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAdmin) {
      router.push('/admin/users');
      return;
    }
    fetchDashboardData();
  }, [isAdmin, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, trendsRes, lowStockRes] = await Promise.all([
        reportsAPI.getDashboard(),
        reportsAPI.getSalesTrends({ period: 'daily' }),
        productsAPI.getLowStock(),
      ]);

      setDashboardData(dashboardRes.data.data);
      setSalesTrends(trendsRes.data.data.trends || []);
      setLowStockProducts(lowStockRes.data.data.products || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </Layout>
    );
  }

  const today = dashboardData?.today || {};
  const monthly = dashboardData?.monthly || {};

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(today.sales)}
          icon={DollarSign}
          trend="up"
          trendValue={`${today.transactions || 0} transactions`}
        />
        <StatCard
          title="Today's Expenses"
          value={formatCurrency(today.expenses)}
          icon={TrendingUp}
        />
        <StatCard
          title="Today's Profit"
          value={formatCurrency(today.profit)}
          icon={ShoppingCart}
          trend={today.profit >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Low Stock Items"
          value={formatNumber(dashboardData?.alerts?.lowStockProducts || 0)}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sales Overview
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last 7 days performance
              </p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesTrends.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-IN', { weekday: 'short' });
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Monthly Summary
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This month's performance
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <ArrowUpRight className="w-5 h-5 text-green-600" />
                <span className="text-gray-600 dark:text-gray-300">Sales</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(monthly.sales)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <ArrowDownRight className="w-5 h-5 text-red-600" />
                <span className="text-gray-600 dark:text-gray-300">Expenses</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(monthly.expenses)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                <span className="text-gray-600 dark:text-gray-300">Net Profit</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(monthly.netProfit)}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Profit Margin</span>
                <span className="text-lg font-bold text-primary-600">
                  {monthly.profitMargin?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Profit Trend
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Daily profit over time
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrends.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Selling Products
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Based on quantity sold
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData?.recentSales?.slice(0, 5) || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  nameKey="product"
                  label={({ product, percent }) =>
                    `${product?.substring(0, 10)}... (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {(dashboardData?.recentSales || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Low Stock Alerts
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Products that need restocking
            </p>
          </div>
          <Badge variant="warning">{lowStockProducts.length} items</Badge>
        </div>
        {lowStockProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Category
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Current Stock
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Min Level
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-dark-border/50">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                      {product.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                      {product.category}
                    </td>
                    <td className="py-3 px-4 text-sm text-center text-gray-900 dark:text-white">
                      {product.quantity}
                    </td>
                    <td className="py-3 px-4 text-sm text-center text-gray-600 dark:text-gray-300">
                      {product.minStockLevel}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={product.quantity === 0 ? 'danger' : 'warning'}>
                        {product.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">
            All products are well stocked!
          </p>
        )}
      </Card>
    </Layout>
  );
}
