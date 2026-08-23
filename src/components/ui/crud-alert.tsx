'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CrudState {
  status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';
  actionName: string;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  message?: string;
}

export function useCrudNotifier() {
  const [crudState, setCrudState] = useState<CrudState>({
    status: 'IDLE',
    actionName: '',
  });

  const startOperation = (actionName: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    setCrudState({
      status: 'LOADING',
      actionName,
      startTime: timeStr,
    });
  };

  const endSuccess = (message: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    setCrudState((prev) => ({
      status: 'SUCCESS',
      actionName: prev.actionName,
      startTime: prev.startTime,
      endTime: timeStr,
      message,
    }));
  };

  const endError = (message: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    setCrudState((prev) => ({
      status: 'ERROR',
      actionName: prev.actionName,
      startTime: prev.startTime,
      endTime: timeStr,
      message,
    }));
  };

  const resetAlert = () => {
    setCrudState({ status: 'IDLE', actionName: '' });
  };

  return {
    crudState,
    startOperation,
    endSuccess,
    endError,
    resetAlert,
  };
}

interface CrudAlertProps {
  state: CrudState;
  onClose: () => void;
}

export function CrudAlertBanner({ state, onClose }: CrudAlertProps) {
  useEffect(() => {
    if (state.status === 'SUCCESS') {
      const timer = setTimeout(() => {
        onClose();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [state.status, onClose]);

  const isSuccess = state.status === 'SUCCESS';
  const isError = state.status === 'ERROR';
  const isLoading = state.status === 'LOADING';

  return (
    <AnimatePresence>
      {state.status !== 'IDLE' && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`fixed top-5 right-5 z-[99999] max-w-md w-full p-4 rounded-xl border backdrop-blur-xl shadow-xl flex items-start justify-between gap-3 ${
            isLoading
              ? 'bg-[var(--bg-card)]/95 border-[var(--accent-cyan)]/50 text-[var(--accent-cyan)] shadow-[0_4px_20px_color-mix(in_srgb,var(--accent-cyan)_20%,transparent)]'
              : isSuccess
              ? 'bg-[var(--bg-card)]/95 border-[var(--accent-emerald)]/50 text-[var(--accent-emerald)] shadow-[0_4px_20px_color-mix(in_srgb,var(--accent-emerald)_20%,transparent)]'
              : 'bg-[var(--bg-card)]/95 border-[var(--accent-crimson)]/50 text-[var(--accent-crimson)] shadow-[0_4px_20px_color-mix(in_srgb,var(--accent-crimson)_20%,transparent)]'
          }`}
        >
          <div className="flex items-start gap-3">
            {isLoading && <Loader2 className="w-5 h-5 text-[var(--accent-cyan)] animate-spin mt-0.5 flex-shrink-0" />}
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-[var(--accent-emerald)] mt-0.5 flex-shrink-0" />}
            {isError && <XCircle className="w-5 h-5 text-[var(--accent-crimson)] mt-0.5 flex-shrink-0" />}

            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-[var(--text-heading)] text-sm">
                  {isLoading && `Procesando...`}
                  {isSuccess && `Operación Exitosa`}
                  {isError && `Error en Operación`}
                </span>
              </div>
              <p className="font-semibold text-[var(--text-primary)]">{state.actionName}</p>

              {state.message && (
                <p className="font-medium text-[var(--text-secondary)] font-sans leading-relaxed mt-1 text-[13px]">{state.message}</p>
              )}

              <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-muted)] pt-1">
                {state.startTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Inicio: {state.startTime}
                  </span>
                )}
                {state.endTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Término: {state.endTime}
                  </span>
                )}
                {isLoading && (
                  <span className="animate-pulse text-[var(--accent-cyan)] font-semibold">● Ejecutando en base de datos...</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
