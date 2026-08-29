'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldAlert, CheckCircle2, Loader2, XCircle } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  variant?: 'danger' | 'warning' | 'success';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  confirmationText?: string;
  consequences?: string[];
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar Acción',
  variant = 'danger',
  requireReason = false,
  reasonPlaceholder = 'Indica la razón o motivo...',
  confirmationText,
  consequences = [],
}: ConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      await onConfirm(reason);
      setReason('');
      setConfirmation('');
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo completar la operación. Inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVariantStyles = () => {
    if (variant === 'danger') return { icon: <ShieldAlert className="w-6 h-6 text-rose-500" />, btnBg: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/25', border: 'border-rose-500/30', iconBg: 'bg-rose-500/15' };
    if (variant === 'warning') return { icon: <AlertTriangle className="w-6 h-6 text-amber-500" />, btnBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25', border: 'border-amber-500/30', iconBg: 'bg-amber-500/15' };
    return { icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />, btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25', border: 'border-emerald-500/30', iconBg: 'bg-emerald-500/15' };
  };

  const styles = getVariantStyles();
  const canConfirm = (!requireReason || Boolean(reason.trim())) && (!confirmationText || confirmation === confirmationText);
  const handleClose = () => {
    if (isSubmitting) return;
    setReason('');
    setConfirmation('');
    setSubmitError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} ariaLabel={title} closeOnBackdrop={!isSubmitting} closeOnEscape={!isSubmitting} closeDisabled={isSubmitting} size="sm" className={`ui-confirm-modal p-5 sm:p-7 bg-[var(--bg-card)] backdrop-blur-2xl border ${styles.border} shadow-2xl space-y-5 font-mono text-[var(--text-primary)]`}>
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`p-2.5 sm:p-3 rounded-2xl border border-[var(--border-card)] shrink-0 ${styles.iconBg}`}>{styles.icon}</div>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-base sm:text-lg font-black text-[var(--text-heading)] uppercase tracking-wider">{title}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed font-sans">{description}</p>
        </div>
      </div>

      {consequences.length > 0 && (
        <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-3.5">
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Esta acción implica</p>
          <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
            {consequences.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true" className="text-[var(--accent-crimson)]">•</span><span>{item}</span></li>)}
          </ul>
        </div>
      )}

      {requireReason && (
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-extrabold text-[var(--text-heading)] uppercase block tracking-wider">Motivo / Razón de la Acción:</label>
          <textarea
            data-autofocus={!confirmationText || undefined}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={reasonPlaceholder}
            className="w-full p-3 rounded-xl input-theme text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-all resize-none shadow-sm"
          />
        </div>
      )}

      {confirmationText && (
        <div className="space-y-1.5">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[var(--text-heading)]">
            Escribe <span className="select-all text-[var(--accent-crimson)]">{confirmationText}</span> para continuar
          </label>
          <input
            data-autofocus
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="ui-control h-11 w-full px-3 font-mono text-xs"
          />
        </div>
      )}

      {submitError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-[var(--accent-crimson)]/35 bg-[var(--accent-crimson-bg)] p-3 text-xs text-[var(--accent-crimson)]">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 border-t border-[var(--border-card)]/50">
        <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting} className="w-full sm:w-auto text-xs font-bold font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] px-4 py-2.5 rounded-xl">
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting || !canConfirm}
          className={`w-full sm:w-auto font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg transition-all hover:scale-[0.98] ${styles.btnBg}`}
        >
          {isSubmitting ? <><Loader2 className="mr-2 inline size-4 animate-spin" />Procesando...</> : confirmText}
        </Button>
      </div>
    </Modal>
  );
}
