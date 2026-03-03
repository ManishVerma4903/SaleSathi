'use client';

import { clsx } from 'clsx';

export default function Card({
  children,
  className = '',
  padding = true,
  hover = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border',
        padding && 'p-6',
        hover && 'hover:shadow-md transition-shadow duration-200 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={clsx('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={clsx('text-lg font-semibold text-gray-900 dark:text-white', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={clsx('text-sm text-gray-500 dark:text-gray-400 mt-1', className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={clsx('', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={clsx('mt-4 pt-4 border-t border-gray-100 dark:border-dark-border', className)}>
      {children}
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, trend, trendValue, className = '' }) {
  const isPositive = trend === 'up';
  
  return (
    <Card className={clsx('', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {trendValue && (
            <p className={clsx(
              'text-sm mt-2 flex items-center gap-1',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              <span>{isPositive ? '↑' : '↓'}</span>
              <span>{trendValue}</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
        )}
      </div>
    </Card>
  );
}
