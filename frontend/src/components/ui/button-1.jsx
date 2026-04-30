import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

/**
 * Button component with variants
 */
export function Button({
  className,
  variant = 'primary',
  size = 'md',
  mode = 'default',
  disabled,
  children,
  ...props
}) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600',
    outline: 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  };

  const sizes = {
    lg: 'h-10 rounded-md px-4 text-sm gap-1.5',
    md: 'h-9 rounded-md px-3 text-sm gap-1.5',
    sm: 'h-8 rounded-md px-2.5 text-xs gap-1',
    icon: 'h-9 w-9 rounded-md p-0',
  };

  return (
    <button
      className={cn(
        'cursor-pointer inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      data-slot="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonArrow({ icon: Icon = ChevronDown, className, ...props }) {
  return <Icon className={cn('ms-auto', className)} {...props} />;
}
