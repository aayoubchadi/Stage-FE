import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Card component - container for grouped content
 */
export function Card({
  className,
  variant = 'default',
  children,
  ...props
}) {
  const variants = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm',
    accent: 'bg-slate-50 dark:bg-slate-800 shadow-sm',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-stretch text-slate-900 dark:text-slate-100 rounded-xl',
        variants[variant],
        className
      )}
      data-slot="card"
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center justify-between flex-wrap px-5 min-h-14 gap-2.5 border-b border-slate-200 dark:border-slate-700', className)}
      data-slot="card-header"
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return (
    <div
      className={cn('grow p-5', className)}
      data-slot="card-content"
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center px-5 min-h-14 border-t border-slate-200 dark:border-slate-700', className)}
      data-slot="card-footer"
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn('text-base font-semibold leading-none tracking-tight', className)}
      data-slot="card-title"
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <div
      className={cn('text-sm text-slate-600 dark:text-slate-400', className)}
      data-slot="card-description"
      {...props}
    />
  );
}
