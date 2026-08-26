import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CountryFlagProps {
  code: string; // e.g. 'cl', 'ar', 'pe', 'mx', etc.
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CountryFlag({ code, name, className = '', size = 'md' }: CountryFlagProps) {
  const codeLower = (code || 'cl').toLowerCase();
  
  const dimensions = {
    sm: 'w-4 h-3',
    md: 'w-6 h-4.5',
    lg: 'w-8 h-6',
  }[size];

  return (
    <Image
      src={`https://flagcdn.com/w40/${codeLower}.png`}
      width={size === 'sm' ? 16 : size === 'md' ? 24 : 32}
      height={size === 'sm' ? 12 : size === 'md' ? 18 : 24}
      alt={name}
      unoptimized
      className={cn("inline-block rounded-sm object-cover shadow-sm border border-[var(--border-card)] shrink-0", dimensions, className)}
    />
  );
}
