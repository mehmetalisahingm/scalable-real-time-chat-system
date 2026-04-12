import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(timestamp: string | null) {
  if (!timestamp) {
    return 'Never active';
  }

  const date = new Date(timestamp);
  const diffInMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));

  if (diffInMinutes < 1) {
    return 'Just now';
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  return date.toLocaleDateString();
}
