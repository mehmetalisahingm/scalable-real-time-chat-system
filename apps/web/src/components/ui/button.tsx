'use client';

import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({
  children,
  className,
  variant = 'primary',
  type = 'button',
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-200',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' &&
          'bg-ember text-white shadow-lg shadow-ember/30 hover:bg-ember/90',
        variant === 'secondary' &&
          'border border-white/15 bg-white/10 text-white hover:border-white/30 hover:bg-white/15',
        variant === 'ghost' && 'text-white/75 hover:bg-white/8 hover:text-white',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
