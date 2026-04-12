'use client';

import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-white outline-none transition',
        'placeholder:text-white/40 focus:border-ember/70 focus:bg-white/12',
        className,
      )}
      {...props}
    />
  );
}
