'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { getAthleteTransferHistoryAction, approveExtraordinaryTransferAction, rejectExtraordinaryTransferAction } from '@/app/actions/transfers';
import {
  Shield,
  User,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  X,
} from 'lucide-react';

export interface OrganizerTransferReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: {
    id: string;
    teamId: string;
    teamName: string;
    applicantUserId: string;
    applicantName: string;
    applicantGamertag?: string;
    position: string;
    pitchMessage?: string;
    gameSlug: string;
    isExtraordinary: boolean;
    createdAt: string;
  };
  organizerUserId: string;
  organizationId?: string;
  brandColor?: string;
  onSuccess?: () => void;
}

export function OrganizerTransferReviewModal({
  isOpen,
  onClose,
  application,
  organizerUserId,
  organizationId,
  brandColor = 'var(--game-brand)',
  onSuccess,
}: OrganizerTransferReviewModalProps) {
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyData, setHistoryData] = useState<{
    totalMovements: number;
    recentTransfers: Array<{
      id: string;
      gameSlug: string;
      fromTeamName: string | null;
      toTeamName: string;
      signedAt: string;
      transferType: string;
    }>;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !application.applicantUserId) return;
    const timer = window.setTimeout(() => {
      setHistoryLoading(true);
      getAthleteTransferHistoryAction(application.applicantUserId, organizationId)
        .then((res) => {
          if (res.success && res.data) {
            setHistoryData(res.data);
          }
        })
        .finally(() => setHistoryLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen, application.applicantUserId, organizationId]);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await approveExtraordinaryTransferAction(application.id, organizerUserId);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || 'Error al aprobar el traspaso.');
      }
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await rejectExtraordinaryTransferAction(application.id, organizerUserId, rejectionReason);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || 'Error al rechazar el traspaso.');
      }
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalMoves = historyData?.totalMovements || 0;
  const isHighMobility = totalMoves >= 3;

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Evaluación de traspaso extraordinario" size="lg" showCloseButton={false} closeDisabled={submitting} className="p-0 overflow-hidden space-y-0 relative flex flex-col" style={{ '--modal-brand': brandColor } as React.CSSProperties}>
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[var(--border-card)] bg-[var(--bg-main)]/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-display text-base text-[var(--text-heading)] uppercase tracking-tight">
                Evaluación de Traspaso Extraordinario
              </h3>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                Panel de Auditoría y Control del Organizador
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Applicant & Transfer Summary */}
          <div className="p-4 rounded-2xl bg-[var(--bg-main)]/60 border border-[var(--border-card)] space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] flex items-center justify-center text-[var(--text-heading)] font-black text-lg shadow-md">
                  <User className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-[var(--text-heading)]">
                    {application.applicantName}
                  </h4>
                  <span className="text-xs font-mono text-cyan-400 font-bold block">
                    @{application.applicantGamertag || 'Atleta'} | Posición: {application.position}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-500/40 px-3 py-1 rounded-full inline-block">
                  ⚠️ Fuera de Plazo / En Curso
                </span>
              </div>
            </div>

            {/* Target Team Banner */}
            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <span className="text-[var(--text-muted)] uppercase font-bold">Solicitud de Ingreso a:</span>
              <strong className="text-[var(--accent-emerald)] font-mono text-sm uppercase flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                {application.teamName}
              </strong>
            </div>

            {application.pitchMessage && (
              <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-secondary)] italic">
                &quot;{application.pitchMessage}&quot;
              </div>
            )}
          </div>

          {/* 2. ANTIFRAUD & MOBILITY AUDIT SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-black uppercase text-[var(--text-muted)] tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                Auditoría de Movimientos e Histórico de Clubes
              </h4>

              {/* Total Movements Counter Badge */}
              <div
                className={`px-3 py-1 rounded-xl text-xs font-mono font-black border flex items-center gap-1.5 ${
                  isHighMobility
                    ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                    : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                }`}
              >
                {isHighMobility && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />}
                <span>{totalMoves} MOVIMIENTOS DE CLUB</span>
              </div>
            </div>

            {isHighMobility && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Advertencia Antifraude:</strong> Este atleta posee {totalMoves} cambios de equipo registrados en la organización. Verifica que no viole la normativa de máximo de traspasos por temporada.
                </span>
              </div>
            )}

            {/* Timeline List of Last Teams Played For */}
            {historyLoading ? (
              <div className="p-6 text-center text-xs font-mono text-[var(--text-muted)] animate-pulse">
                Consultando historial de fichajes en BD...
              </div>
            ) : historyData?.recentTransfers && historyData.recentTransfers.length > 0 ? (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {historyData.recentTransfers.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="p-2.5 rounded-xl bg-[var(--bg-main)]/70 border border-[var(--border-card)] flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[var(--text-muted)] text-[10px]">
                        {new Date(t.signedAt).toLocaleDateString()}
                      </span>
                      <span className="text-[var(--text-muted)]">{t.fromTeamName || 'Agente Libre'}</span>
                      <ArrowRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                      <strong className="text-[var(--text-heading)] truncate">{t.toTeamName}</strong>
                    </div>
                    <span className="text-[9px] uppercase px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-card)] text-cyan-400 shrink-0">
                      {t.transferType}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center rounded-xl bg-[var(--bg-main)]/40 border border-[var(--border-card)] text-xs font-mono text-[var(--text-muted)]">
                Sin traspasos previos registrados en esta organización (Atleta Limpio).
              </div>
            )}
          </div>

          {/* Rejection Form Field */}
          {showRejectForm && (
            <div className="space-y-2 p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 animate-fade-in">
              <label className="text-xs font-mono font-bold text-rose-300 block">
                Motivo del Rechazo (Visible para el Atleta y Capitán):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ejemplo: Exceso de cambios de club en la misma temporada o violacion del reglamento..."
                className="w-full h-20 p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
              />
            </div>
          )}
        </div>

        {/* Footer Action Buttons */}
        <div className="px-6 py-4 border-t border-[var(--border-card)] bg-[var(--bg-main)]/80 flex items-center justify-end gap-3 shrink-0">
          {!showRejectForm ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(true)}
                className="text-xs font-mono border-rose-500/40 text-rose-400 hover:bg-rose-950/40"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Rechazar Traspaso
              </Button>
              <Button
                onClick={handleApprove}
                disabled={submitting}
                className="text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {submitting ? 'Procesando...' : 'Aprobar y Registrar Fichaje'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setShowRejectForm(false)}
                className="text-xs font-mono"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReject}
                disabled={submitting || !rejectionReason.trim()}
                className="text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              >
                {submitting ? 'Guardando...' : 'Confirmar Rechazo'}
              </Button>
            </>
          )}
        </div>
    </Modal>
  );
}
