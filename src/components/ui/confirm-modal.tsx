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
    if (variant === 'danger') {
      return {
        icon: <ShieldAlert className="w-6 h-6 text-[var(--app-danger)]" />,
        btnVariant: 'danger' as const,
        iconBg: 'bg-[var(--app-danger-soft)] border-[var(--app-danger)] text-[var(--app-danger)]',
      };
    }
    if (variant === 'warning') {
      return {
        icon: <AlertTriangle className="w-6 h-6 text-[var(--app-warning)]" />,
        btnVariant: 'primary' as const,
        iconBg: 'bg-[var(--app-warning-soft)] border-[var(--app-warning)] text-[var(--app-warning)]',
      };
    }
    return {
      icon: <CheckCircle2 className="w-6 h-6 text-[var(--app-positive)]" />,
      btnVariant: 'primary' as const,
      iconBg: 'bg-[var(--app-positive-soft)] border-[var(--app-positive)] text-[var(--app-positive)]',
    };
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabel={title}
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
      closeDisabled={isSubmitting}
      size="sm"
      className="ui-confirm-modal p-0 overflow-hidden"
    >
      <div className="ui-confirm-content font-[family-name:var(--font-active)]" data-variant={variant}>
        <div className="ui-confirm-header flex items-start gap-3.5">
          <div className={`ui-confirm-icon shrink-0 border ${styles.iconBg}`}>
            {styles.icon}
          </div>
          <div className="min-w-0 pt-0.5 font-[family-name:var(--font-active)]">
            <span className="ui-confirm-kicker">Confirmación requerida</span>
            <h3 className="text-base font-black text-[var(--text-heading)] uppercase tracking-tight font-[family-name:var(--font-active)]">
              {title}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed font-[family-name:var(--font-active)]">
              {description}
            </p>
          </div>
        </div>

        {consequences.length > 0 && (
          <div className="ui-confirm-consequences space-y-2 font-[family-name:var(--font-active)]">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] font-[family-name:var(--font-active)]">
              Consecuencias directas:
            </p>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] font-[family-name:var(--font-active)]">
              {consequences.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[var(--app-danger)] font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {requireReason && (
          <div className="ui-confirm-field space-y-1.5 font-[family-name:var(--font-active)]">
            <label className="text-xs font-bold text-[var(--text-heading)] uppercase block font-[family-name:var(--font-active)]">
              Motivo o justificación:
            </label>
            <textarea
              data-autofocus={!confirmationText || undefined}
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              className="ui-control w-full resize-none p-3 text-xs font-[family-name:var(--font-active)] font-medium"
            />
          </div>
        )}

        {confirmationText && (
          <div className="ui-confirm-field space-y-1.5 font-[family-name:var(--font-active)]">
            <label className="block text-xs font-bold uppercase text-[var(--text-heading)] font-[family-name:var(--font-active)]">
              Escribe <span className="select-all text-[var(--app-danger)] font-black">{confirmationText}</span> para confirmar:
            </label>
            <input
              data-autofocus
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="ui-control h-11 w-full px-3.5 font-[family-name:var(--font-active)] text-xs font-bold"
            />
          </div>
        )}

        {submitError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-[var(--app-danger)] bg-[var(--app-danger-soft)] p-3 text-xs text-[var(--app-danger)]">
            <XCircle className="mt-0.5 size-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="ui-confirm-actions flex flex-col-reverse gap-2 border-t border-[var(--border-card)] sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={styles.btnVariant}
            onClick={handleConfirm}
            disabled={isSubmitting || !canConfirm}
            className="w-full px-5 text-xs sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="inline size-4 animate-spin" />
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
