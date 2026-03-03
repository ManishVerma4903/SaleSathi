'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Search, Edit2, Eye, User, Mail, Store, Lock, Calendar, ShoppingCart, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Layout } from '@/components/layout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Loader from '@/components/ui/Loader';
import toast from 'react-hot-toast';
import { useDebounce } from '@/hooks/useDebounce';

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [isAdmin, pagination.page, debouncedSearch]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users', {
        params: { page: pagination.page, limit: 10, search: debouncedSearch }
      });
      setUsers(response.data.data.users);
      setPagination(prev => ({
        ...prev,
        totalPages: response.data.data.pagination.totalPages
      }));
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };
  console.log(users);
  const fetchUserStats = async (userId) => {
    try {
      setStatsLoading(true);
      const response = await api.get(`/admin/users/${userId}/stats`);
      setUserStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch user stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleViewUser = async (userItem) => {
    setSelectedUser(userItem);
    setShowViewModal(true);
    fetchUserStats(userItem._id);
  };

  const handleEditUser = (userItem) => {
    setSelectedUser(userItem);
    reset({
      name: userItem.name,
      email: userItem.email,
      shopName: userItem.shopName || '',
      password: ''
    });
    setShowEditModal(true);
  };

  const onSubmitEdit = async (data) => {
    try {
      setSaving(true);
      const updateData = {
        name: data.name,
        email: data.email,
        shopName: data.shopName
      };

      if (data.password) {
        updateData.password = data.password;
      }

      await api.put(`/admin/users/${selectedUser._id}`, updateData);
      toast.success('User updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all registered users</p>
        </div>

        <Card>
          <div className="p-4 border-b border-gray-200 dark:border-dark-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or shop name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Shop Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                  {users.map((userItem) => (
                    <tr key={userItem._id} className="hover:bg-gray-50 dark:hover:bg-dark-border/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{userItem.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{userItem.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {userItem.shopName || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${userItem.role === 'admin'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                          {userItem.role === 'shop_owner' ? 'Shop Owner' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {formatDate(userItem.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewUser(userItem)}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(userItem)}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-200 dark:border-dark-border">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </Card>

        {/* View User Modal */}
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedUser(null);
            setUserStats(null);
          }}
          title="User Details"
        >
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-dark-border">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Store className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Shop Name</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedUser.shopName || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedUser.role === 'shop_owner' && (
                <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Shop Statistics</h4>
                  {statsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader size="sm" />
                    </div>
                  ) : userStats ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 dark:bg-dark-border rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-500" />
                          <span className="text-xs text-gray-500">Products</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                          {userStats.totalProducts}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-dark-border rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-gray-500">Sales</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                          {userStats.totalSales}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
            reset();
          }}
          title="Edit User"
        >
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
            <Input
              label="Name"
              {...register('name', { required: 'Name is required' })}
              error={errors.name?.message}
              icon={User}
            />

            <Input
              label="Email"
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              error={errors.email?.message}
              icon={Mail}
            />

            {selectedUser?.role === 'shop_owner' && (
              <Input
                label="Shop Name"
                {...register('shopName')}
                icon={Store}
              />
            )}

            <Input
              label="New Password"
              type="password"
              {...register('password', {
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              error={errors.password?.message}
              placeholder="Leave empty to keep current password"
              icon={Lock}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
