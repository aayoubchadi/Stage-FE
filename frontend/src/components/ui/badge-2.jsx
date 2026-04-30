import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Badge component - displays labels with variants
 * Variants: primary, secondary, success, warning, destructive, outline
 * Sizes: lg, md, sm, xs
 */
export function Badge({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) {
  const variants = {
    primary: 'bg-blue-600 text-white',
    secondary: 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-600 text-white',
    destructive: 'bg-red-600 text-white',
    outline: 'border-2 border-slate-200 text-slate-900 dark:border-slate-700 dark:text-slate-100 bg-transparent',
  };

  const sizes = {
    lg: 'px-2 py-1 text-xs rounded-md',
    md: 'px-2 py-0.5 text-xs rounded',
    sm: 'px-1.5 py-0.5 text-xs rounded',
    xs: 'px-1 py-0 text-[0.625rem] rounded',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-medium gap-1',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function BadgeDot({ className, ...props }) {
  return (
    <span
      className={cn('size-1.5 rounded-full bg-current opacity-75', className)}
      {...props}
    />
  );
}
