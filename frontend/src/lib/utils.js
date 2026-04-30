import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to combine and dedupe Tailwind class names.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
