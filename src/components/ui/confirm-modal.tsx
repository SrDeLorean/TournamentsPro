'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldAlert, CheckCircle2, X } from 'lucide-react';

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
}: ConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (e) {
      console.error('Error al confirmar:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVariantStyles = () => {
    if (variant === 'danger') return { icon: <ShieldAlert className="w-6 h-6 text-rose-400" />, btnBg: 'bg-rose-600 hover:bg-rose-500 text-white', border: 'border-rose-500/40' };
    if (variant === 'warning') return { icon: <AlertTriangle className="w-6 h-6 text-amber-400" />, btnBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950', border: 'border-amber-500/40' };
    return { icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />, btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950', border: 'border-emerald-500/40' };
  };

  const styles = getVariantStyles();

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={`max-w-md p-6 bg-slate-950 border ${styles.border} shadow-2xl space-y-4`}>
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-slate-900 border border-white/10">{styles.icon}</div>
        <div>
          <h3 className="text-base font-black uppercase text-white tracking-wider">{title}</h3>
          <p className="text-xs text-slate-300 mt-0.5">{description}</p>
        </div>
      </div>

      {requireReason && (
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-slate-300 uppercase block">Motivo / Razón de la Acción:</label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={reasonPlaceholder}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-400"
          />
        </div>
      )}

      <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-white">
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting || (requireReason && !reason.trim())}
          className={`font-black text-xs px-5 py-2.5 rounded-xl shadow-xl ${styles.btnBg}`}
        >
          {isSubmitting ? 'Procesando...' : confirmText}
        </Button>
      </div>
    </Modal>
  );
}
