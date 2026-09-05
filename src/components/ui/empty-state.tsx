'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  brandColor?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  brandColor = 'var(--app-accent)',
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] relative overflow-hidden font-[family-name:var(--font-active)]',
        className
      )}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: brandColor }}
      />

      {/* Icon */}
      <div
        className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border border-[var(--border-card)] shadow-sm"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${brandColor} 15%, transparent), color-mix(in srgb, ${brandColor} 5%, transparent))`,
        }}
      >
        <div style={{ color: brandColor }}>{icon}</div>
      </div>

      {/* Text */}
      <h3 className="text-lg font-bold text-[var(--text-heading)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] max-w-md leading-relaxed mb-6">{description}</p>

      {/* Action */}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
