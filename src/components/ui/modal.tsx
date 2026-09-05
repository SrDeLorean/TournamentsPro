'use client';

import React, { useEffect, useId, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  ariaLabel?: string;
  children: React.ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  closeDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
  style?: React.CSSProperties;
}

const modalSizes: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)]',
};

const subscribeToClient = () => () => {};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  ariaLabel,
  children,
  className,
  closeOnBackdrop = true,
  closeOnEscape = true,
  closeDisabled = false,
  size = 'md',
  showCloseButton = true,
  style,
}: ModalProps) {
  const mounted = useSyncExternalStore(subscribeToClient, () => true, () => false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  useBodyScrollLock(isOpen, 'modal');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape && !closeDisabled) onClose();
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      window.addEventListener('keydown', handleKeyDown);
      const frame = window.requestAnimationFrame(() => {
        const preferred = dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]');
        const fallback = dialogRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
        );
        (preferred ?? fallback)?.focus();
      });
      return () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener('keydown', handleKeyDown);
        previousFocusRef.current?.focus();
      };
    }
  }, [closeDisabled, closeOnEscape, isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="ui-modal-layer fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          {/* Backdrop with Glass Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ui-modal-backdrop fixed inset-0 bg-[var(--bg-main)]/75 backdrop-blur-md"
            onClick={closeOnBackdrop && !closeDisabled ? onClose : undefined}
          />

          {/* Modal Dialog Box */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
            role="dialog"
            aria-modal="true"
            aria-label={!title ? ariaLabel : undefined}
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            style={style}
            className={cn(
              'ui-modal-shell relative z-10 w-full max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-[var(--radius-hero)] bg-[var(--bg-card)] border border-[var(--border-card)] p-6 sm:p-7 shadow-2xl text-[var(--text-primary)] font-[family-name:var(--font-active)]',
              modalSizes[size],
              className
            )}
          >
            {/* Top Accent Ambient Glow Rim */}
            <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-[var(--app-accent)] to-transparent opacity-85" />

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                disabled={closeDisabled}
                aria-label="Cerrar ventana"
                className="ui-modal-close absolute top-5 right-5 p-2 rounded-[var(--radius-control)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] border border-transparent hover:border-[var(--border-card)] transition-all disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-1 font-[family-name:var(--font-active)] text-[11px] font-bold uppercase tracking-wider"
                title="Cerrar modal (Esc)"
              >
                <span className="hidden sm:inline opacity-60">ESC</span>
                <X className="w-4 h-4" />
              </button>
            )}

            {title && (
              <div className="ui-modal-heading mb-6 pr-14">
                <h3
                  id={titleId}
                  className="text-lg sm:text-xl font-black text-[var(--text-heading)] uppercase tracking-tight font-[family-name:var(--font-active)]"
                >
                  {title}
                </h3>
                {description && (
                  <p id={descriptionId} className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed font-[family-name:var(--font-active)]">
                    {description}
                  </p>
                )}
              </div>
            )}

            <div className="ui-modal-content min-h-0">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
