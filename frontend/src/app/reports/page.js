'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import { Layout } from '@/components/layout';
import { Card, StatCard, Button, Badge, PageLoader } from '@/components/ui';
import { reportsAPI } from '@/services/api';
import { formatCurrency, formatNumber, getDateRange } from '@/utils/formatCurrency';
import { useAuth } from '@/context/AuthContext';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [dailyProfit, setDailyProfit] = useState([]);
  const [categoryProfit, setCategoryProfit] = useState([]);
  const [dateRange, setDateRange] = useState(() => getDateRange('month'));

  useEffect(() => {
    if (isAdmin) {
      router.push('/admin/users');
      return;
    }
    fetchReportData();
  }, [dateRange, isAdmin, router]);

  if (isAdmin) return null;

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      const [summaryRes, dailyRes, categoryRes] = await Promise.all([
        reportsAPI.getSummary(params),
        reportsAPI.getDailyProfit(params),
        reportsAPI.getCategoryProfit(params),
      ]);

      setReportData(summaryRes.data.data);
      setDailyProfit(dailyRes.data.data.dailyBreakdown || []);
      setCategoryProfit(categoryRes.data.data.categoryProfit || []);
    } catch (error) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    const rows = [
      ['Report Summary'],
      ['Date Range', `${dateRange.startDate} to ${dateRange.endDate}`],
      [''],
      ['Metric', 'Value'],
      ['Total Sales', reportData.financials.totalSales],
      ['Total Expenses', reportData.financials.totalExpenses],
      ['Cost of Goods Sold', reportData.financials.costOfGoodsSold],
      ['Gross Profit', reportData.financials.grossProfit],
      ['Net Profit', reportData.financials.netProfit],
      ['Gross Margin %', reportData.financials.grossMargin],
      ['Profit Margin %', reportData.financials.profitMargin],
      [''],
      ['Top Selling Products'],
      ['Product', 'Quantity Sold', 'Revenue', 'Profit'],
      ...(reportData.topSellingProducts || []).map((p) => [
        p.productName,
        p.totalQuantity,
        p.totalRevenue,
        p.totalProfit,
      ]),
    ];

    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${dateRange.startDate}_${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const handleQuickDateRange = (range) => {
    setDateRange(getDateRange(range));
  };

  if (loading) {
    return (
      <Layout>
        <PageLoader />
      </Layout>
    );
  }

  const financials = reportData?.financials || {};

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-dark-card px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="bg-transparent outline-none text-sm"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="bg-transparent outline-none text-sm"
            />
          </div>
          <div className="flex gap-2">
            {['today', 'week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => handleQuickDateRange(range)}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-dark-card transition-colors capitalize"
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <Button icon={Download} onClick={handleExportCSV}>
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Sales"
          value={formatCurrency(financials.totalSales)}
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(financials.totalExpenses)}
          icon={TrendingDown}
        />
        <StatCard
          title="Gross Profit"
          value={formatCurrency(financials.grossProfit)}
          icon={TrendingUp}
          trendValue={`${financials.grossMargin || 0}% margin`}
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(financials.netProfit)}
          icon={TrendingUp}
          trend={financials.netProfit >= 0 ? 'up' : 'down'}
          trendValue={`${financials.profitMargin || 0}% margin`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daily Revenue & Profit
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Breakdown over selected period
            </p>
            <div className="flex gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Net Profit</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyProfit} barCategoryGap="20%">
                <defs>
                  <linearGradient id="revenueBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="profitBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const date = new Date(label);
                      return (
                        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded bg-blue-500"></span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                              </span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(payload[0]?.value || 0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded bg-emerald-500"></span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Profit</span>
                              </span>
                              <span className="text-sm font-semibold text-emerald-600">
                                {formatCurrency(payload[1]?.value || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="url(#revenueBarGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="netProfit"
                  name="Net Profit"
                  fill="url(#profitBarGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Profit by Category
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Category-wise profit distribution
            </p>
          </div>
          <div className="h-80 flex items-center">
            {categoryProfit.length > 0 ? (
              <div className="w-full flex flex-col lg:flex-row items-center gap-4">
                <div className="w-full lg:w-1/2 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryProfit}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="grossProfit"
                        nameKey="category"
                      >
                        {categoryProfit.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {payload[0].name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatCurrency(payload[0].value)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full lg:w-1/2 space-y-2">
                  {categoryProfit.map((item, index) => {
                    const total = categoryProfit.reduce((acc, curr) => acc + curr.grossProfit, 0);
                    const percentage = total > 0 ? ((item.grossProfit / total) * 100).toFixed(1) : 0;
                    return (
                      <div key={item.category} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {item.category}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">{percentage}%</span>
                          </div>
                          <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: COLORS[index % COLORS.length]
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(item.grossProfit)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500 w-full">No category data available</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
          {reportData?.topSellingProducts?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-border">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Product
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Qty
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Revenue
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Profit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                  {reportData.topSellingProducts.map((product, index) => (
                    <tr key={index}>
                      <td className="py-3 px-2 text-sm text-gray-900 dark:text-white">
                        {product.productName}
                      </td>
                      <td className="py-3 px-2 text-sm text-right text-gray-600 dark:text-gray-300">
                        {product.totalQuantity}
                      </td>
                      <td className="py-3 px-2 text-sm text-right text-gray-900 dark:text-white">
                        {formatCurrency(product.totalRevenue)}
                      </td>
                      <td className="py-3 px-2 text-sm text-right text-green-600">
                        {formatCurrency(product.totalProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No sales data available</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Low Stock Products
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Products that need restocking
              </p>
            </div>
            <Badge variant="warning">
              {reportData?.lowStockProducts?.count || 0} items
            </Badge>
          </div>
          {reportData?.lowStockProducts?.products?.length > 0 ? (
            <div className="space-y-3">
              {reportData.lowStockProducts.products.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Min: {product.minStockLevel}
                      </p>
                    </div>
                  </div>
                  <Badge variant={product.currentStock === 0 ? 'danger' : 'warning'}>
                    {product.currentStock} left
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">All products well stocked</p>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Expenses by Category
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Breakdown of expenses
          </p>
        </div>
        {reportData?.expensesByCategory?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {reportData.expensesByCategory.map((expense, index) => (
              <div
                key={expense._id}
                className="p-4 bg-gray-50 dark:bg-dark-border rounded-lg text-center"
              >
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {expense._id}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(expense.totalAmount)}
                </p>
                <p className="text-xs text-gray-500">{expense.count} transactions</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">No expense data available</p>
        )}
      </Card>
    </Layout>
  );
}
