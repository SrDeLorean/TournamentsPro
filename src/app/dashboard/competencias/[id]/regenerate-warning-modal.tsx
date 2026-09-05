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
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Regenerar fixture" size="md" showCloseButton={false} closeDisabled={isSubmitting} className="glass-panel border-[var(--app-danger)]/50 p-6 space-y-6 relative overflow-hidden">
        {/* Header con icono de peligro */}
        <div className="flex items-start justify-between border-b border-[var(--app-danger)]/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[var(--app-danger-soft)]/80 border border-[var(--app-danger)]/40 text-[var(--app-danger)]">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase text-[var(--text-heading)] tracking-wider flex items-center gap-2">
                Zona de Peligro: Regeneración Destructiva
              </h3>
              <p className="text-xs text-[var(--app-danger)] font-[family-name:var(--font-active)]">
                Se detectaron resultados reportados en la competencia.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[var(--text-muted)] hover:text-[var(--text-heading)] p-1 rounded-lg hover:bg-[var(--app-surface-2)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Advertencia Severa Explicita */}
        <div className="p-4 rounded-xl bg-[var(--app-danger-soft)]/40 border border-[var(--app-danger)]/30 text-xs font-[family-name:var(--font-active)] text-[var(--app-danger)] space-y-2 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5 text-[var(--app-danger)] uppercase">
            <ShieldAlert className="w-4 h-4" />
            ⚠️ ADVERTENCIA CRÍTICA:
          </p>
          <p>
            Ya existen partidos con resultados reportados en esta competencia. Al regenerar el fixture,{' '}
            <strong className="text-[var(--text-heading)] underline">PERDERÁS TODAS</strong> las actas, capturas y resultados de los partidos ya jugados.
          </p>
          <p className="text-[var(--text-secondary)]">
            ¿Estás absolutamente seguro de continuar? Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Formulario de Confirmación por Nombre */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase block font-[family-name:var(--font-active)]">
              Escribe exactamente <span className="text-[var(--app-accent)] font-black">&quot;{competitionName}&quot;</span> para confirmar:
            </label>

            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={competitionName}
              className="input-theme w-full p-3 rounded-xl font-[family-name:var(--font-active)] text-xs font-bold border-[var(--app-danger)]/30 focus:border-[var(--app-danger)]"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-heading)]"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={!isConfirmed || isSubmitting}
              className={`text-xs font-black px-6 py-2.5 rounded-xl shadow-xl flex items-center gap-2 ${
                isConfirmed
                  ? 'bg-[var(--app-danger)] hover:bg-[var(--app-danger)] text-[var(--text-heading)] shadow-[color:var(--app-danger)]'
                  : 'bg-[var(--app-surface-2)] text-[var(--text-muted)] border border-[var(--text-heading)]/10 cursor-not-allowed'
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
