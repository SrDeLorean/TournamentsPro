'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { AlertTriangle, ShieldAlert, X, Trash2 } from 'lucide-react';

interface RegenerateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (typedName: string) => void;
  competitionName: string;
  isSubmitting?: boolean;
}

export function RegenerateWarningModal({
  isOpen,
  onClose,
  onConfirm,
  competitionName,
  isSubmitting = false,
}: RegenerateWarningModalProps) {
  const [typedName, setTypedName] = useState('');

  if (!isOpen) return null;

  const isConfirmed = typedName.trim() === competitionName.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfirmed) {
      onConfirm(typedName);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Regenerar fixture" size="md" showCloseButton={false} closeDisabled={isSubmitting} className="glass-panel border-rose-500/50 p-6 space-y-6 relative overflow-hidden">
        {/* Header con icono de peligro */}
        <div className="flex items-start justify-between border-b border-rose-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
                Zona de Peligro: Regeneración Destructiva
              </h3>
              <p className="text-xs text-rose-300 font-mono">
                Se detectaron resultados reportados en la competencia.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Advertencia Severa Explicita */}
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs font-mono text-rose-200 space-y-2 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5 text-rose-400 uppercase">
            <ShieldAlert className="w-4 h-4" />
            ⚠️ ADVERTENCIA CRÍTICA:
          </p>
          <p>
            Ya existen partidos con resultados reportados en esta competencia. Al regenerar el fixture,{' '}
            <strong className="text-white underline">PERDERÁS TODAS</strong> las actas, capturas y resultados de los partidos ya jugados.
          </p>
          <p className="text-slate-300">
            ¿Estás absolutamente seguro de continuar? Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Formulario de Confirmación por Nombre */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase block font-mono">
              Escribe exactamente <span className="text-cyan-400 font-black">&quot;{competitionName}&quot;</span> para confirmar:
            </label>

            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={competitionName}
              className="input-theme w-full p-3 rounded-xl font-mono text-xs font-bold border-rose-500/30 focus:border-rose-500"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={!isConfirmed || isSubmitting}
              className={`text-xs font-black px-6 py-2.5 rounded-xl shadow-xl flex items-center gap-2 ${
                isConfirmed
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50'
                  : 'bg-slate-900 text-slate-500 border border-white/10 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Regenerando...' : 'Borrar y Regenerar Fixture'}</span>
            </Button>
          </div>
        </form>
    </Modal>
  );
}
