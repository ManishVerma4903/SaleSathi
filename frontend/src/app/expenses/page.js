'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Receipt,
  Calendar,
  Trash2,
  TrendingDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '@/components/layout';
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  ConfirmModal,
  Table,
  Pagination,
  Badge,
  PageLoader,
} from '@/components/ui';
import { expensesAPI } from '@/services/api';
import { formatCurrency, formatDateTime } from '@/utils/formatCurrency';
import { useAuth } from '@/context/AuthContext';

const expenseCategories = [
  'Rent',
  'Utilities',
  'Salaries',
  'Marketing',
  'Supplies',
  'Maintenance',
  'Transportation',
  'Insurance',
  'Miscellaneous',
];

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

export default function ExpensesPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isAdmin) {
      router.push('/admin/users');
    }
  }, [isAdmin, router]);

  if (isAdmin) return null;
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [summary, setSummary] = useState({ totalAmount: 0, totalTransactions: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      paymentMethod: 'cash',
    },
  });

  const fetchExpenses = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.category && { category: filters.category }),
      };
      
      const response = await expensesAPI.getAll(params);
      setExpenses(response.data.data.expenses);
      setPagination(response.data.data.pagination);
      setSummary(response.data.data.summary);
    } catch (error) {
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleAddExpense = async (data) => {
    try {
      setSubmitting(true);
      await expensesAPI.create(data);
      toast.success('Expense added successfully');
      setShowAddModal(false);
      reset();
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    try {
      setSubmitting(true);
      await expensesAPI.delete(selectedExpense._id);
      toast.success('Expense deleted successfully');
      setShowDeleteModal(false);
      setSelectedExpense(null);
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete expense');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Rent: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      Utilities: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      Salaries: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Marketing: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      Supplies: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      Maintenance: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      Transportation: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      Insurance: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  const columns = [
    {
      key: 'category',
      title: 'Category',
      render: (value) => (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: (value) => (
        <p className="text-gray-900 dark:text-white max-w-xs truncate">{value}</p>
      ),
    },
    {
      key: 'amount',
      title: 'Amount',
      render: (value) => (
        <span className="font-semibold text-red-600">
          -{formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      title: 'Payment',
      render: (value) => (
        <span className="capitalize text-gray-600 dark:text-gray-300">
          {value?.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'vendor',
      title: 'Vendor',
      render: (value) => value || '-',
    },
    {
      key: 'createdBy',
      title: 'Added By',
      render: (value) => value?.name || '-',
    },
    {
      key: 'createdAt',
      title: 'Date',
      render: (value) => formatDateTime(value),
    },
    {
      key: 'actions',
      title: '',
      render: (_, expense) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedExpense(expense);
            setShowDeleteModal(true);
          }}
          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-red-100 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</p>
            </div>
          </div>
          <p className="text-red-100 text-sm mt-3">{summary.totalTransactions} transactions</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">All Categories</option>
              {expenseCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Expense
          </Button>
        </div>

        {loading ? (
          <PageLoader />
        ) : (
          <>
            <Table
              columns={columns}
              data={expenses}
              emptyMessage="No expenses found"
            />
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={10}
              onPageChange={(page) => fetchExpenses(page)}
            />
          </>
        )}
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          reset();
        }}
        title="Add New Expense"
        size="md"
      >
        <form onSubmit={handleSubmit(handleAddExpense)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">Select category</option>
              {expenseCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>

          <Input
            label="Description"
            placeholder="Enter expense description"
            error={errors.description?.message}
            {...register('description', { required: 'Description is required' })}
          />

          <Input
            label="Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount', {
              required: 'Amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' },
            })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Payment Method
            </label>
            <select
              {...register('paymentMethod')}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {paymentMethods.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Vendor"
            placeholder="Enter vendor name (optional)"
            {...register('vendor')}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Add Expense
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedExpense(null);
        }}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message={`Are you sure you want to delete this expense of ${formatCurrency(selectedExpense?.amount)}?`}
        loading={submitting}
      />
    </Layout>
  );
}
