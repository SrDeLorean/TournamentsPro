'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

export function Modal({ isOpen, onClose, title, description, ariaLabel, children, className, closeOnBackdrop = true, closeOnEscape = true, closeDisabled = false, size = 'md', showCloseButton = true, style }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    // Portals are mounted only after hydration because document.body is browser-only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape && !closeDisabled) onClose();
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
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
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      const frame = window.requestAnimationFrame(() => {
        const preferred = dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]');
        const fallback = dialogRef.current?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
        (preferred ?? fallback)?.focus();
      });
      return () => {
        window.cancelAnimationFrame(frame);
        document.body.style.overflow = previousOverflow;
        window.removeEventListener('keydown', handleKeyDown);
        previousFocusRef.current?.focus();
      };
    }
  }, [closeDisabled, closeOnEscape, isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="ui-modal-layer fixed inset-0 flex items-center justify-center p-2 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md"
            onClick={closeOnBackdrop && !closeDisabled ? onClose : undefined}
          />

          {/* Modal Dialog */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-label={!title ? ariaLabel : undefined}
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            style={style}
            className={cn(
              "relative z-10 w-full max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-[var(--ui-radius-card)] bg-[var(--bg-card)] backdrop-blur-2xl border border-[var(--border-card)] p-4 sm:p-6 shadow-2xl text-[var(--text-primary)] font-sans",
              modalSizes[size],
              className
            )}
          >
            {showCloseButton ? <button
              type="button"
              onClick={onClose}
              disabled={closeDisabled}
              aria-label="Cerrar ventana"
              className="absolute top-4 right-4 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              title="Cerrar modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button> : null}

            {title && (
              <div className="mb-5 pr-8">
                <h3 id={titleId} className="text-lg sm:text-xl font-extrabold text-[var(--text-heading)] uppercase tracking-wider font-sans text-pretty">{title}</h3>
                {description && <p id={descriptionId} className="text-xs text-[var(--text-muted)] mt-1 font-sans text-pretty">{description}</p>}
              </div>
            )}

            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
