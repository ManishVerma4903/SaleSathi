'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  User,
  Lock,
  LogOut,
  Moon,
  Sun,
  Bell,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsPage() {
  const { user, updateProfile, changePassword, logout, isAdmin, isShopOwner } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch,
    formState: { errors: passwordErrors },
  } = useForm();

  const newPassword = watch('newPassword');

  const onProfileSubmit = async (data) => {
    setProfileLoading(true);
    try {
      await updateProfile(data);
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true);
    try {
      const result = await changePassword(data.currentPassword, data.newPassword);
      if (result.success) {
        resetPassword();
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Profile Settings
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Update your personal information
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Enter your name"
                error={profileErrors.name?.message}
                {...registerProfile('name', { required: 'Name is required' })}
              />
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  disabled={isShopOwner}
                  error={profileErrors.email?.message}
                  {...registerProfile('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
                {isShopOwner && (
                  <p className="text-xs text-gray-500 mt-1">Contact admin to change email</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-dark-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Role</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your account permissions
                  </p>
                </div>
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium capitalize">
                  {user?.role.replace('_', ' ').toLowerCase()}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={profileLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Lock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Change Password
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Update your account password
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter current password"
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword', {
                required: 'Current password is required',
              })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                error={passwordErrors.newPassword?.message}
                {...registerPassword('newPassword', {
                  required: 'New password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm new password"
                error={passwordErrors.confirmPassword?.message}
                {...registerPassword('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === newPassword || 'Passwords do not match',
                })}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={passwordLoading}>
                Update Password
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Preferences
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customize your experience
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-border rounded-lg">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Dark Mode
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Toggle dark/light theme
                  </p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'left-8' : 'left-1'
                    }`}
                />
              </button>
            </div>
          </div>
        </Card>

        <Card className="border-red-200 dark:border-red-900/50">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Account Actions
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your session
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Sign Out
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                End your current session
              </p>
            </div>
            <Button variant="danger" icon={LogOut} onClick={logout}>
              Logout
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
