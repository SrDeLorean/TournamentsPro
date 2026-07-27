'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

export interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  brandColor?: string;
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
  children,
}: ModalFormProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-0 overflow-hidden bg-slate-950 border border-white/10 shadow-2xl">
      <div
        className="p-5 border-b flex items-center justify-between"
        style={{
          borderColor: `color-mix(in srgb, ${brandColor} 30%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${brandColor} 8%, transparent)`,
        }}
      >
        <div>
          <h3 className="text-base font-black uppercase text-white tracking-wider">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-5">
        {children}

        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-white">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="font-black text-xs px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-2"
            style={{
              backgroundColor: brandColor,
              color: '#020617',
            }}
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Guardando...' : submitButtonText}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
