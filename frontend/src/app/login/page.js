'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Store, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Card } from '@/components/ui';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, register: registerUser, isAuthenticated, user, isAdmin } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (isAdmin) {
        router.push('/admin/users');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, isAdmin, router]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isLogin) {
        await login(data.email, data.password);
      } else {
        const result = await registerUser(data.name, data.email, data.password, data.shopName);
        if (result.success) {
          setIsLogin(true);
          reset();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isLogin ? 'Welcome Back' : 'Register Your Shop'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {isLogin
              ? 'Sign in to manage your shop'
              : 'Create an account to start managing your shop'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {!isLogin && (
            <>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                icon={User}
                error={errors.name?.message}
                {...register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters',
                  },
                })}
              />
              <Input
                label="Shop Name"
                placeholder="Enter your shop name"
                icon={Store}
                error={errors.shopName?.message}
                {...register('shopName', {
                  required: 'Shop name is required',
                  minLength: {
                    value: 2,
                    message: 'Shop name must be at least 2 characters',
                  },
                })}
              />
            </>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            icon={Mail}
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Please enter a valid email',
              },
            })}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            icon={Lock}
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
          />

          <Button type="submit" fullWidth loading={loading}>
            {isLogin ? 'Sign In' : 'Register Shop'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              {isLogin ? 'Register Shop' : 'Sign In'}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
