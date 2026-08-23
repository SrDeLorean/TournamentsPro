'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

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
  brandColor = '#00F0FF',
  successMessage,
  errorMessage,
  infoMessage,
  children,
}: ModalFormProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-0 overflow-hidden bg-[var(--bg-card)] backdrop-blur-2xl border border-[var(--border-card)] shadow-2xl font-mono text-[var(--text-primary)]">
      <div
        className="p-5 border-b border-[var(--border-card)] flex items-center justify-between"
        style={{
          backgroundColor: `color-mix(in srgb, ${brandColor} 12%, transparent)`,
        }}
      >
        <div>
          <h3 className="text-base font-black text-[var(--text-heading)] uppercase tracking-wider">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-5">
        {/* BANNER ALERTA ÉXITO */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 font-mono shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* BANNER ALERTA ERROR */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2 font-mono shadow-sm">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* BANNER ALERTA INFO */}
        {infoMessage && (
          <div className="p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-bold flex items-center gap-2 font-mono shadow-sm">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {children}

        <div className="pt-5 border-t border-[var(--border-card)] flex items-center justify-end gap-3 mt-4">
          <Button type="button" variant="ghost" onClick={onClose} className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] px-4 py-2.5 rounded-xl">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="font-black text-xs uppercase px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-[0.98]"
            style={{
              backgroundColor: brandColor,
              color: '#020617',
              boxShadow: `0 4px 14px 0 color-mix(in srgb, ${brandColor} 30%, transparent)`,
            }}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSubmitting ? 'Guardando...' : submitButtonText}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
