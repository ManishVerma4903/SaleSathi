'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const shopOwnerMenuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Sales', href: '/sales', icon: ShoppingCart },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const adminMenuItems = [
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { logout, user, isAdmin } = useAuth();
  
  const menuItems = isAdmin ? adminMenuItems : shopOwnerMenuItems;

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleCollapse = () => {
    const newValue = !collapsed;
    setCollapsed(newValue);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newValue));
  };

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border',
        'flex flex-col transition-all duration-300 z-40',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
        <Link href={isAdmin ? "/admin/users" : "/dashboard"} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Store className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-xl text-gray-900 dark:text-white">
              SaleSathi
            </span>
          )}
        </Link>
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-500 dark:text-gray-400 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border'
              )}
              title={collapsed ? item.name : ''}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-dark-border">
        {!collapsed && user && (
          <div className="mb-4 px-4 py-3 bg-gray-50 dark:bg-dark-border rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.name}
            </p>
            {user.shopName && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.shopName}
              </p>
            )}
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded capitalize">
              {user.role === 'shop_owner' ? 'Shop Owner' : user.role === 'admin' ? 'Admin' : user.role}
            </span>
          </div>
        )}
        <button
          onClick={logout}
          className={clsx(
            'flex items-center gap-3 w-full px-4 py-3 rounded-lg',
            'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
          )}
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
