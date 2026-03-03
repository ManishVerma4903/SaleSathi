'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  User,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/sales': 'Sales',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function Navbar({ onMenuToggle, isMobileMenuOpen }) {
  const [showSearch, setShowSearch] = useState(false);
  const pathname = usePathname();
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();

  const pageTitle = pageTitles[pathname] || 'Dashboard';

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-gray-200 dark:border-dark-border">
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-600 dark:text-gray-300"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {pageTitle}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">
              Welcome back, {user?.name || 'User'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className={clsx(
            'transition-all duration-300 overflow-hidden',
            showSearch ? 'w-64' : 'w-0 md:w-64'
          )}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-600 dark:text-gray-300"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-600 dark:text-gray-300 transition-colors"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-600 dark:text-gray-300 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button> */}

          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-dark-border">
            <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
