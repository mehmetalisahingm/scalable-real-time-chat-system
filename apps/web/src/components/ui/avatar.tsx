'use client';

import Image from 'next/image';

import { cn } from '@/lib/utils';

interface AvatarProps {
  src: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
}

export function Avatar({ src, alt, size = 'md', online }: AvatarProps) {
  const dimensions = size === 'sm' ? 36 : size === 'lg' ? 56 : 44;

  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          'overflow-hidden rounded-2xl border border-white/10 bg-white/8',
          size === 'sm' && 'h-9 w-9',
          size === 'md' && 'h-11 w-11',
          size === 'lg' && 'h-14 w-14',
        )}
      >
        {src ? (
          <Image src={src} alt={alt} width={dimensions} height={dimensions} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/60">
            {alt.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      {typeof online === 'boolean' ? (
        <span
          className={cn(
            'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#09101b]',
            online ? 'bg-pine' : 'bg-white/20',
          )}
        />
      ) : null}
    </div>
  );
}
