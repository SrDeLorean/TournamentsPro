'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle2, AlertCircle, Info, Loader2, ShieldCheck } from 'lucide-react';

export interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  brandColor?: string;
  successMessage?: string;
  errorMessage?: string;
  infoMessage?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  submitDisabled?: boolean;
  children: React.ReactNode;
}

export function ModalForm({
  isOpen,
  onClose,
  title,
  subtitle,
  onSubmit,
  isSubmitting = false,
  submitButtonText = 'Guardar Registro',
  brandColor = 'var(--app-accent)',
  successMessage,
  errorMessage,
  infoMessage,
  size = 'lg',
  submitDisabled = false,
  children,
}: ModalFormProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={title}
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
      closeDisabled={isSubmitting}
      size={size}
      className="ui-modal-form p-0 overflow-hidden"
    >
      <div
        className="ui-modal-form-header relative flex items-start gap-3 border-b border-[var(--border-card)] p-5 pr-14 sm:p-6 sm:pr-16"
        style={{
          '--modal-brand': brandColor,
        } as React.CSSProperties}
      >
        <span className="ui-modal-form-icon" aria-hidden="true"><Save /></span>
        <div className="min-w-0">
          <span className="ui-modal-form-kicker">Formulario de gestión</span>
          <h3 className="text-base sm:text-lg font-black text-[var(--text-heading)] uppercase tracking-tight font-[family-name:var(--font-active)]">{title}</h3>
          {subtitle && <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{subtitle}</p>}
        </div>
      </div>

      <form onSubmit={onSubmit} className="ui-modal-form-content">
        <div className="ui-modal-form-body space-y-5 p-5 text-xs text-[var(--text-primary)] sm:p-7">
          {successMessage && (
            <div role="status" className="ui-modal-feedback is-success">
              <CheckCircle2 className="w-4 h-4 text-[var(--app-positive)] flex-shrink-0" />
              <div><strong>Operación completada</strong><span>{successMessage}</span></div>
            </div>
          )}

          {errorMessage && (
            <div role="alert" className="ui-modal-feedback is-danger">
              <AlertCircle className="w-4 h-4 text-[var(--app-danger)] flex-shrink-0" />
              <div><strong>No pudimos completar la acción</strong><span>{errorMessage}</span></div>
            </div>
          )}

          {infoMessage && (
            <div role="status" className="ui-modal-feedback is-info">
              <Info className="w-4 h-4 text-[var(--app-accent)] flex-shrink-0" />
              <div><strong>Información importante</strong><span>{infoMessage}</span></div>
            </div>
          )}

          {children}
        </div>

        <div className="ui-modal-form-actions flex flex-col-reverse gap-3 border-t border-[var(--border-card)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <span className="ui-modal-form-assurance"><ShieldCheck /> Validación segura antes de guardar</span>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || submitDisabled}
            className="ui-modal-submit w-full sm:w-auto"
            style={{
              '--button-brand': brandColor,
            } as React.CSSProperties}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSubmitting ? 'Guardando...' : submitButtonText}</span>
          </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
