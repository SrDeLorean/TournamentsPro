import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { shouldBypassImageOptimization } from '@/lib/image-utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away';
  className?: string;
  style?: React.CSSProperties;
}

export function Avatar({ src, alt = 'Avatar', fallback = 'U', size = 'md', status, className, style, ...props }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-500',
    away: 'bg-amber-500',
  };
  const pixels = { sm: 32, md: 40, lg: 48, xl: 64 }[size];

  return (
    <div className={cn("relative inline-flex flex-shrink-0", className)} style={style} {...props}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={pixels}
          height={pixels}
          sizes={`${pixels}px`}
          unoptimized={shouldBypassImageOptimization(src)}
          className={cn("rounded-xl object-cover border border-[var(--border-card)] shadow-sm", sizes[size])}
        />
      ) : (
        <div
          className={cn(
            "rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-violet)] flex items-center justify-center font-bold text-white shadow-sm border border-[var(--border-card)] uppercase",
            sizes[size]
          )}
        >
          {fallback.slice(0, 2)}
        </div>
      )}

      {status && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950",
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}
