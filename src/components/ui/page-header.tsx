'use client';

import React from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  title: string;
  highlightTitle?: string;
  description: string;
  brandColor?: string;
  children?: React.ReactNode;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
  }
};

export function PageHeader({
  badgeText,
  badgeIcon,
  title,
  highlightTitle,
  description,
  brandColor = 'var(--accent-cyan)',
  children,
}: PageHeaderProps) {
  const defaultIcon = <Flame className="w-3.5 h-3.5" style={{ color: brandColor, fill: brandColor }} />;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-2 pb-4"
    >
      {/* Left Title & Description */}
      <div className="space-y-4 max-w-2xl">
        {badgeText && (
          <motion.div variants={itemVariants}>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md shadow-sm"
              style={{
                backgroundColor: `color-mix(in srgb, ${brandColor} 15%, transparent)`,
                borderColor: `color-mix(in srgb, ${brandColor} 40%, transparent)`,
                color: brandColor,
              }}
            >
              {badgeIcon || defaultIcon}
              {badgeText}
            </div>
          </motion.div>
        )}

        <motion.h1 variants={itemVariants} className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--text-heading)] uppercase leading-none">
          {title}{' '}
          {highlightTitle && (
            <span
              className="block"
              style={{
                color: brandColor,
                filter: `drop-shadow(0 0 20px color-mix(in srgb, ${brandColor} 50%, transparent))`,
              }}
            >
              {highlightTitle}
            </span>
          )}
        </motion.h1>

        <motion.p variants={itemVariants} className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
          {description}
        </motion.p>
      </div>

      {/* Right Side Slot (Telemetry / Stats / Quick Action) */}
      {children && (
        <motion.div variants={itemVariants} className="flex-shrink-0 w-full lg:w-auto">
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}
