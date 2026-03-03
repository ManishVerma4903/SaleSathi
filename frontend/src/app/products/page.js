'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Filter,
  Scale,
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
import { productsAPI } from '@/services/api';
import { formatCurrency } from '@/utils/formatCurrency';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';

export default function ProductsPage() {
  const router = useRouter();
  const { isAdmin, isShopOwner } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  useEffect(() => {
    if (isAdmin) {
      router.push('/admin/users');
    }
  }, [isAdmin, router]);

  if (isAdmin) return null;
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      weightUnit: 'g',
      quantity: 0,
      weight: 0,
    }
  });

  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(categoryFilter && { category: categoryFilter }),
      };

      const response = await productsAPI.getAll(params);
      setProducts(response.data.data.products);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts]);

  const handleAddProduct = async (data) => {
    try {
      setSubmitting(true);
      const productData = {
        ...data,
        quantity: Number(data.quantity) || 0,
        weight: Number(data.weight) || 0,
        purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : undefined,
        sellingPrice: data.sellingPrice ? Number(data.sellingPrice) : undefined,
        minStockLevel: Number(data.minStockLevel) || 5,
        minWeightLevel: Number(data.minWeightLevel) || 0,
      };
      await productsAPI.create(productData);
      toast.success('Product added successfully');
      setShowAddModal(false);
      fetchProducts();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProduct = async (data) => {
    try {
      setSubmitting(true);
      const productData = {
        ...data,
        quantity: Number(data.quantity) || 0,
        weight: Number(data.weight) || 0,
        purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : undefined,
        sellingPrice: data.sellingPrice ? Number(data.sellingPrice) : undefined,
        minStockLevel: Number(data.minStockLevel) || 5,
        minWeightLevel: Number(data.minWeightLevel) || 0,
      };
      await productsAPI.update(selectedProduct._id, productData);
      toast.success('Product updated successfully');
      setShowEditModal(false);
      setSelectedProduct(null);
      fetchProducts();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      setSubmitting(true);
      await productsAPI.delete(selectedProduct._id);
      toast.success('Product deleted successfully');
      setShowDeleteModal(false);
      setSelectedProduct(null);
      fetchProducts();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  const openAddModal = () => {
    reset({
      name: '',
      category: '',
      quantity: 0,
      weight: 0,
      weightUnit: 'g',
      purity: '',
      purchasePrice: '',
      sellingPrice: '',
      minStockLevel: 5,
      minWeightLevel: 0,
      supplier: '',
      description: '',
    });
    setShowAddModal(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    reset({
      ...product,
      weightUnit: product.weightUnit || 'g',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const columns = [
    {
      key: 'name',
      title: 'Product',
      render: (_, product) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${product.weight > 0
            ? 'bg-yellow-100 dark:bg-yellow-900/30'
            : 'bg-primary-100 dark:bg-primary-900/30'
            }`}>
            {product.weight > 0 ? (
              <Scale className="w-5 h-5 text-yellow-600" />
            ) : (
              <Package className="w-5 h-5 text-primary-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
            <p className="text-sm text-gray-500">{product.category || 'General'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'quantity',
      title: 'Quantity',
      render: (value) => value || 0,
    },
    {
      key: 'weight',
      title: 'Weight',
      render: (_, product) => (
        product.weight > 0
          ? `${product.weight} ${product.weightUnit}`
          : <span className="text-gray-400">-</span>
      ),
    },
    {
      key: 'Category',
      title: 'Category',
      render: (_, product) => product.category || <span className="text-gray-400">product.category</span>
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, product) => (
        product.isLowStock ? (
          <Badge variant="warning">Low Stock</Badge>
        ) : (
          <Badge variant="success">In Stock</Badge>
        )
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, product) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(product)}
            className="p-2"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          {(isShopOwner || isAdmin) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeleteModal(product)}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const ProductForm = ({ onSubmit, isEdit = false }) => {
    const [showMore, setShowMore] = useState(false);

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Product Name *"
            placeholder="Enter product name"
            error={errors.name?.message}
            {...register('name', { required: 'Product name is required' })}
          />
          <Input
            label="Category"
            placeholder="e.g., Gold, Silver, Electronics"
            {...register('category')}
          />
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900 dark:text-white">Stock Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Quantity"
              type="number"
              placeholder="0"
              error={errors.quantity?.message}
              {...register('quantity', {
                min: { value: 0, message: 'Must be positive' },
              })}
            />
            <Input
              label="Weight"
              type="number"
              step="0.001"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:ring-2 focus:ring-primary-500 outline-none"
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
        </div>

        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          {showMore ? '− Hide' : '+ Show'} Additional Details (Price, Purity, etc.)
        </button>

        {showMore && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-dark-border rounded-lg">
            <Input
              label="Purity (for Jewellery)"
              placeholder="e.g., 22K, 24K, 916"
              {...register('purity')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Purchase Price"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.purchasePrice?.message}
                {...register('purchasePrice', {
                  min: { value: 0, message: 'Price must be positive' },
                })}
              />
              <Input
                label="Selling Price"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.sellingPrice?.message}
                {...register('sellingPrice', {
                  min: { value: 0, message: 'Price must be positive' },
                })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Min Stock Level (for alerts)"
                type="number"
                placeholder="5"
                {...register('minStockLevel', {
                  min: { value: 0, message: 'Must be positive' },
                })}
              />
              <Input
                label="Min Weight Level (for alerts)"
                type="number"
                step="0.001"
                placeholder="0"
                {...register('minWeightLevel', {
                  min: { value: 0, message: 'Must be positive' },
                })}
              />
            </div>

            <Input
              label="Supplier"
              placeholder="Enter supplier name"
              {...register('supplier')}
            />

            <Input
              label="Description"
              placeholder="Enter product description"
              {...register('description')}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              isEdit ? setShowEditModal(false) : setShowAddModal(false);
              reset();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEdit ? 'Update Product' : 'Add Product'}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <Layout>
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat._id} ({cat.count})
                </option>
              ))}
            </select>
          </div>
          <Button icon={Plus} onClick={openAddModal}>
            Add Product
          </Button>
        </div>

        {loading ? (
          <PageLoader />
        ) : (
          <>
            <Table
              columns={columns}
              data={products}
              emptyMessage="No products found"
            />
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={10}
              onPageChange={(page) => fetchProducts(page)}
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
        title="Add New Product"
        size="lg"
      >
        <ProductForm onSubmit={handleAddProduct} />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
          reset();
        }}
        title="Edit Product"
        size="lg"
      >
        <ProductForm onSubmit={handleEditProduct} isEdit />
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        loading={submitting}
      />
    </Layout>
  );
}
