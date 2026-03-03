'use client';

import { clsx } from 'clsx';

export default function Loader({
  size = 'md',
  className = '',
  fullScreen = false,
  text = '',
}) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div
      className={clsx(
        'rounded-full border-primary-200 dark:border-dark-border border-t-primary-600',
        'animate-spin',
        sizes[size],
        className
      )}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-dark-bg/80 backdrop-blur-sm">
        {spinner}
        {text && (
          <p className="mt-4 text-gray-600 dark:text-gray-300 animate-pulse">{text}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {spinner}
      {text && (
        <p className="mt-4 text-gray-600 dark:text-gray-300">{text}</p>
      )}
    </div>
  );
}

export function PageLoader({ text = 'Loading...' }) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 rounded-full border-primary-200 dark:border-dark-border border-t-primary-600 animate-spin" />
      <p className="mt-4 text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
}

export function Skeleton({ className = '', rounded = 'md' }) {
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200 dark:bg-dark-border',
        roundedStyles[rounded],
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-card rounded-xl p-6 border border-gray-100 dark:border-dark-border">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="w-12 h-12" rounded="lg" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} className="h-8 flex-1" />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(columns)].map((_, j) => (
            <Skeleton key={j} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
