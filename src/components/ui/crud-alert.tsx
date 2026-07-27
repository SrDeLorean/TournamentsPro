'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, Clock, X } from 'lucide-react';

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

  if (state.status === 'IDLE') return null;

  const isSuccess = state.status === 'SUCCESS';
  const isError = state.status === 'ERROR';
  const isLoading = state.status === 'LOADING';

  return (
    <div
      className={`fixed top-5 right-5 z-[99999] max-w-md w-full p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-5 flex items-start justify-between gap-3 ${
        isLoading
          ? 'bg-slate-950/95 border-cyan-500/70 text-cyan-200 shadow-cyan-950/50'
          : isSuccess
          ? 'bg-slate-950/95 border-emerald-500/70 text-emerald-200 shadow-emerald-950/50'
          : 'bg-slate-950/95 border-rose-500/70 text-rose-200 shadow-rose-950/50'
      }`}
    >
      <div className="flex items-start gap-3">
        {isLoading && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin mt-0.5 flex-shrink-0" />}
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />}
        {isError && <XCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />}

        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black uppercase tracking-wider text-white text-sm">
              {isLoading && `⏳ PROCESANDO: ${state.actionName}`}
              {isSuccess && `✅ OPERACIÓN EXITOSA: ${state.actionName}`}
              {isError && `❌ ERROR EN OPERACIÓN: ${state.actionName}`}
            </span>
          </div>

          {state.message && (
            <p className="font-medium text-slate-200 font-sans leading-relaxed">{state.message}</p>
          )}

          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-300 pt-1">
            {state.startTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                Inicio: {state.startTime}
              </span>
            )}
            {state.endTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                Término: {state.endTime}
              </span>
            )}
            {isLoading && (
              <span className="animate-pulse text-cyan-300 font-bold">● Ejecutando cambios en base de datos...</span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
