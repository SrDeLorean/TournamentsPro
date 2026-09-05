'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Loader2, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CrudState {
  status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';
  actionName: string;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  startEpoch?: number;
  message?: string;
}

export function useCrudNotifier() {
  const [crudState, setCrudState] = useState<CrudState>({
    status: 'IDLE',
    actionName: '',
  });

  const startOperation = useCallback((actionName: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    setCrudState({
      status: 'LOADING',
      actionName,
      startTime: timeStr,
      startEpoch: now.getTime(),
    });
  }, []);

  const endSuccess = useCallback((message: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    setCrudState((prev) => ({
      status: 'SUCCESS',
      actionName: prev.actionName,
      startTime: prev.startTime,
      endTime: timeStr,
      durationMs: prev.startEpoch ? now.getTime() - prev.startEpoch : undefined,
      message,
    }));
  }, []);

  const endError = useCallback((message: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    setCrudState((prev) => ({
      status: 'ERROR',
      actionName: prev.actionName,
      startTime: prev.startTime,
      endTime: timeStr,
      durationMs: prev.startEpoch ? now.getTime() - prev.startEpoch : undefined,
      message,
    }));
  }, []);

  const resetAlert = useCallback(() => {
    setCrudState({ status: 'IDLE', actionName: '' });
  }, []);

  const runOperation = useCallback(async <T,>(actionName: string, operation: () => Promise<T>, successMessage: string | ((result: T) => string)) => {
    startOperation(actionName);
    try {
      const result = await operation();
      endSuccess(typeof successMessage === 'function' ? successMessage(result) : successMessage);
      return result;
    } catch (error) {
      endError(error instanceof Error ? error.message : 'No se pudo completar la operación.');
      throw error;
    }
  }, [endError, endSuccess, startOperation]);

  return {
    crudState,
    startOperation,
    endSuccess,
    endError,
    resetAlert,
    runOperation,
  };
}

interface CrudAlertProps {
  state: CrudState;
  onClose: () => void;
}

export function CrudAlertBanner({ state, onClose }: CrudAlertProps) {
  const [mounted, setMounted] = useState(false);
  const autoDismissMs = 6000;
  // Portals depend on document.body and therefore mount after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (state.status === 'SUCCESS') {
      const timer = setTimeout(() => {
        onClose();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [state.status, onClose]);

  const isSuccess = state.status === 'SUCCESS';
  const isError = state.status === 'ERROR';
  const isLoading = state.status === 'LOADING';

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {state.status !== 'IDLE' && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          role={isError ? 'alert' : 'status'}
          aria-live={isError ? 'assertive' : 'polite'}
          aria-atomic="true"
          className={`ui-crud-alert fixed inset-x-3 top-[max(.75rem,env(safe-area-inset-top))] mx-auto w-auto max-w-md overflow-hidden rounded-2xl border p-4 backdrop-blur-xl shadow-2xl sm:inset-x-auto sm:right-5 sm:top-5 sm:w-full ${
            isLoading
              ? 'bg-[var(--bg-card)]/95 border-[var(--app-accent)]/50 text-[var(--app-accent)] shadow-[0_4px_20px_color-mix(in_srgb,var(--app-accent)_20%,transparent)]'
              : isSuccess
              ? 'bg-[var(--bg-card)]/95 border-[var(--app-positive)]/50 text-[var(--app-positive)] shadow-[0_4px_20px_color-mix(in_srgb,var(--app-positive)_20%,transparent)]'
              : 'bg-[var(--bg-card)]/95 border-[var(--app-danger)]/50 text-[var(--app-danger)] shadow-[0_4px_20px_color-mix(in_srgb,var(--app-danger)_20%,transparent)]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {isLoading && <Loader2 className="w-5 h-5 text-[var(--app-accent)] animate-spin mt-0.5 flex-shrink-0" />}
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-[var(--app-positive)] mt-0.5 flex-shrink-0" />}
            {isError && <XCircle className="w-5 h-5 text-[var(--app-danger)] mt-0.5 flex-shrink-0" />}

            <div className="min-w-0 space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-[var(--text-heading)] text-sm">
                  {isLoading && `Procesando...`}
                  {isSuccess && `Operación Exitosa`}
                  {isError && `Error en Operación`}
                </span>
              </div>
              <p className="break-words font-semibold text-[var(--text-primary)]">{state.actionName || 'Actualizando información'}</p>

              {state.message && (
                <p className="font-medium text-[var(--text-secondary)] font-[family-name:var(--font-active)] leading-relaxed mt-1 text-[13px]">{state.message}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-[family-name:var(--font-active)] font-medium text-[var(--text-muted)] pt-1">
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
                  <span className="animate-pulse text-[var(--app-accent)] font-semibold">● Ejecutando en base de datos...</span>
                )}
                {typeof state.durationMs === 'number' && <span>{state.durationMs < 1000 ? `${state.durationMs} ms` : `${(state.durationMs / 1000).toFixed(1)} s`}</span>}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar notificación"
            className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          </div>
          {isSuccess && (
            <motion.div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-1 origin-left bg-[var(--app-positive)]"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: autoDismissMs / 1000, ease: 'linear' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
