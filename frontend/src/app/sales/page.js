'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import {
  Plus,
  Search,
  ShoppingCart,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '@/components/layout';
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  Table,
  Pagination,
  Badge,
  PageLoader,
} from '@/components/ui';
import { salesAPI, productsAPI } from '@/services/api';
import { formatCurrency, formatDateTime } from '@/utils/formatCurrency';
import { useAuth } from '@/context/AuthContext';

const paymentMethods = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'upi', label: 'UPI', icon: Smartphone },
];

export default function SalesPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [summary, setSummary] = useState({ totalAmount: 0, totalTransactions: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: '',
  });

  useEffect(() => {
    if (isAdmin) {
      router.push('/admin/users');
    }
  }, [isAdmin, router]);

  if (isAdmin) return null;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      quantity: 0,
      weight: 0,
      weightUnit: 'g',
      totalPrice: '',
      paymentMethod: 'cash',
    },
  });

  const watchProduct = watch('product');
  const watchQuantity = watch('quantity');
  const watchTotalPrice = watch('totalPrice');

  useEffect(() => {
    if (watchProduct) {
      const product = products.find((p) => p._id === watchProduct);
      setSelectedProduct(product);
    } else {
      setSelectedProduct(null);
    }
  }, [watchProduct, products]);

  const fetchSales = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
      };

      const response = await salesAPI.getAll(params);
      setSales(response.data.data.sales);
      setPagination(response.data.data.pagination);
      setSummary(response.data.data.summary);
    } catch (error) {
      toast.error('Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll({ limit: 100 });
      setProducts(response.data.data.products.filter((p) => p.quantity > 0 || p.weight > 0));
    } catch (error) {
      console.error('Failed to fetch products');
    }
  };

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, [fetchSales]);

  const handleAddSale = async (data) => {
    try {
      setSubmitting(true);
      const response = await salesAPI.create({
        product: data.product,
        quantity: parseInt(data.quantity) || 0,
        weight: parseFloat(data.weight) || 0,
        weightUnit: data.weightUnit,
        totalPrice: parseFloat(data.totalPrice),
        paymentMethod: data.paymentMethod,
        customerName: data.customerName,
        notes: data.notes,
      });

      toast.success('Sale recorded successfully');

      if (response.data.warning) {
        toast(response.data.warning, { icon: '⚠️' });
      }

      setShowAddModal(false);
      reset({ quantity: 0, weight: 0, weightUnit: 'g', totalPrice: '', paymentMethod: 'cash' });
      setSelectedProduct(null);
      fetchSales();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  const getTotal = () => {
    return watchTotalPrice ? parseFloat(watchTotalPrice) : 0;
  };

  const getPaymentIcon = (method) => {
    const pm = paymentMethods.find((p) => p.value === method);
    return pm ? pm.icon : CreditCard;
  };

  const columns = [
    {
      key: 'productName',
      title: 'Product',
      render: (_, sale) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{sale.productName}</p>
            <p className="text-sm text-gray-500">
              {sale.quantity > 0 && `Qty: ${sale.quantity}`}
              {sale.quantity > 0 && sale.weight > 0 && ' • '}
              {sale.weight > 0 && `${sale.weight} ${sale.weightUnit}`}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      title: 'Amount',
      render: (value) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'grossProfit',
      title: 'Profit',
      render: (value) => (
        <span className="text-green-600 font-medium">
          +{formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      title: 'Payment',
      render: (value) => {
        const Icon = getPaymentIcon(value);
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-400" />
            <span className="capitalize">{value}</span>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      title: 'Date',
      render: (value) => formatDateTime(value),
    },
  ];

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <p className="text-green-100 text-sm">Total Sales</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(summary.totalAmount)}</p>
          <p className="text-green-100 text-sm mt-2">{summary.totalTransactions} transactions</p>
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
              value={filters.paymentMethod}
              onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">All Payments</option>
              {paymentMethods.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>
          <Button icon={Plus} onClick={() => setShowAddModal(true)}>
            New Sale
          </Button>
        </div>

        {loading ? (
          <PageLoader />
        ) : (
          <>
            <Table
              columns={columns}
              data={sales}
              emptyMessage="No sales found"
            />
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={10}
              onPageChange={(page) => fetchSales(page)}
            />
          </>
        )}
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          reset({ quantity: 0, weight: 0, weightUnit: 'g', totalPrice: '', paymentMethod: 'cash' });
          setSelectedProduct(null);
        }}
        title="Record New Sale"
        size="md"
      >
        <form onSubmit={handleSubmit(handleAddSale)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              {...register('product', { required: 'Please select a product' })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} (Stock: {product.quantity})
                </option>
              ))}
            </select>
            {errors.product && (
              <p className="mt-1 text-sm text-red-500">{errors.product.message}</p>
            )}
          </div>

          {selectedProduct && (
            <div className="p-4 bg-gray-50 dark:bg-dark-border rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Default price:</span>
                <span className="font-medium">
                  {selectedProduct.sellingPrice ? formatCurrency(selectedProduct.sellingPrice) : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Available stock:</span>
                <span className="font-medium">{selectedProduct.quantity}</span>
              </div>
              {selectedProduct.weight > 0 && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Weight:</span>
                  <span className="font-medium">{selectedProduct.weight} {selectedProduct.weightUnit}</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              min="0"
              placeholder="0"
              error={errors.quantity?.message}
              {...register('quantity', {
                min: { value: 0, message: 'Must be positive' },
              })}
            />
            <Input
              label="Total Price *"
              type="number"
              step="0.01"
              placeholder="Enter total amount"
              error={errors.totalPrice?.message}
              {...register('totalPrice', {
                required: 'Total price is required',
                min: { value: 0, message: 'Price must be positive' },
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Weight"
              type="number"
              step="0.001"
              min="0"
              placeholder="0.00"
              error={errors.weight?.message}
              {...register('weight', {
                min: { value: 0, message: 'Must be positive' },
              })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Weight Unit
              </label>
              <select
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:ring-2 focus:ring-primary-500 outline-none"
                {...register('weightUnit')}
              >
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="mg">Milligrams (mg)</option>
                <option value="tola">Tola</option>
                <option value="oz">Ounces (oz)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((pm) => (
                <label
                  key={pm.value}
                  className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${watch('paymentMethod') === pm.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-dark-border hover:border-gray-400'
                    }`}
                >
                  <input
                    type="radio"
                    value={pm.value}
                    {...register('paymentMethod')}
                    className="sr-only"
                  />
                  <pm.icon className={`w-5 h-5 ${watch('paymentMethod') === pm.value
                    ? 'text-primary-600'
                    : 'text-gray-400'
                    }`} />
                  <span className="text-sm">{pm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Input
            label="Customer Name"
            placeholder="Optional"
            {...register('customerName')}
          />

          <Input
            label="Notes"
            placeholder="Optional notes"
            {...register('notes')}
          />

          {watchTotalPrice > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(getTotal())}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                reset({ quantity: 0, weight: 0, weightUnit: 'g', totalPrice: '', paymentMethod: 'cash' });
                setSelectedProduct(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Record Sale
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
