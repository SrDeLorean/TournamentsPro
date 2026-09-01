'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import {
  FileText,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Clock,
  Shield,
  Loader2,
  AlertCircle,
  History,
  Building2,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getUserOffersAction, respondNewContractOfferService, getAthleteTransferHistoryAction } from '@/app/actions/transfers';

interface OfferItem {
  id: string;
  team_id: string;
  team_name: string;
  team_tag?: string | null;
  logo_url?: string | null;
  position: string;
  pitch_message?: string | null;
  game_slug: string;
  created_at: string;
  status: 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO';
}

interface TransferHistoryItem {
  id: string;
  gameSlug: string;
  fromTeamName: string | null;
  toTeamName: string;
  transferType: string;
  signedAt: string;
  approvedByName?: string | null;
}

export default function AtletaOfertasPage() {
  const { currentUser } = useAuth();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [history, setHistory] = useState<TransferHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadData = useCallback(async () => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
      const [offersRes, historyRes] = await Promise.all([
        getUserOffersAction(currentUser.id),
        getAthleteTransferHistoryAction(currentUser.id),
      ]);

      if (offersRes.success && offersRes.offers) {
        setOffers(offersRes.offers as unknown as OfferItem[]);
      }
      if (historyRes.success && historyRes.data?.recentTransfers) {
        setHistory(historyRes.data.recentTransfers);
      }
    } catch (err) {
      console.error('Error cargando ofertas de atleta:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRespondOffer = (offerId: string, action: 'ACEPTADO' | 'RECHAZADO') => {
    setFeedback(null);
    startTransition(async () => {
      // Optimistic update
      setOffers((prev) => prev.filter((o) => o.id !== offerId));

      const res = await respondNewContractOfferService(offerId, action);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: action === 'ACEPTADO' ? '¡Has aceptado la oferta! Ya formas parte del club.' : 'Oferta de contrato rechazada.',
        });
        await loadData();
      } else {
        setFeedback({
          type: 'error',
          text: res.error || 'Error al responder oferta.',
        });
        await loadData();
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300 font-mono">
      <PageHeader
        badgeText="Bolsa de Trabajo & Mercado de Pases"
        badgeIcon={<ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />}
        title="MIS OFERTAS &"
        highlightTitle="FICHAJES."
        description="Revisa las propuestas de contrato enviadas por capitanes y clubes para unirte a sus plantillas oficiales."
      />

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-mono font-bold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-950/70 text-rose-300 border-rose-500/40'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* OFERTAS PENDIENTES */}
      <Card className="border-[var(--border-card)] bg-[var(--bg-card)]">
        <CardHeader className="border-b border-[var(--border-card)]">
          <CardTitle className="text-lg font-black uppercase text-[var(--text-heading)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <span>Propuestas de Contrato Recibidas ({offers.length})</span>
            </div>
            {offers.length > 0 && (
              <Badge variant="violet" className="text-xs font-mono">
                {offers.length} Pendiente{offers.length > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="p-12 text-center text-[var(--text-muted)] font-mono text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              Cargando tus propuestas de contrato...
            </div>
          ) : offers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-card)] text-[var(--text-muted)] font-mono text-xs space-y-3">
              <Shield className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-50" />
              <p className="text-sm font-bold text-[var(--text-primary)]">No tienes ofertas pendientes en este momento.</p>
              <p className="max-w-md mx-auto text-[var(--text-muted)]">
                Visita el Mercado de Traspasos para publicar tu perfil y recibir convocatorias de clubes en tu disciplina.
              </p>
              <Link href="/traspasos" className="inline-block mt-2">
                <Button size="sm" variant="ghost" className="text-xs font-mono text-purple-400 border border-[var(--border-card)]">
                  <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />
                  Ir al Muro de Traspasos
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => {
                const orgMatch = offer.pitch_message?.match(/\[Organización:\s*([^\]]+)\]/i);
                const orgName = orgMatch ? orgMatch[1].trim() : null;
                const cleanPitch = offer.pitch_message?.replace(/\[Organización:\s*[^\]]+\]/i, '').trim();

                return (
                  <div
                    key={offer.id}
                    className="p-5 rounded-2xl bg-[var(--bg-main)] border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-purple-500/60 transition-all shadow-md"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <Avatar
                        src={offer.logo_url || undefined}
                        fallback={offer.team_tag || offer.team_name.slice(0, 2).toUpperCase()}
                        size="md"
                        className="ring-2 ring-purple-500/40 flex-shrink-0"
                      />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-sm text-[var(--text-heading)] uppercase">
                            {offer.team_name}
                          </h4>
                          {offer.team_tag && (
                            <Badge variant="cyan" className="text-[10px] font-mono">
                              [{offer.team_tag}]
                            </Badge>
                          )}
                          <Badge variant="violet" className="text-[10px] font-mono">
                            {offer.game_slug.toUpperCase()}
                          </Badge>
                          {orgName && (
                            <Badge variant="gold" className="text-[10px] font-mono flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5" />
                              {orgName}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-[var(--text-muted)]">
                          Posición Ofrecida: <span className="text-purple-400 font-bold">{offer.position}</span>
                          {cleanPitch && (
                            <span className="block mt-1 text-slate-300 italic">
                              &ldquo;{cleanPitch}&rdquo;
                            </span>
                          )}
                        </p>

                        <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 pt-1">
                          <Clock className="w-3 h-3" />
                          <span>Recibida el {new Date(offer.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleRespondOffer(offer.id, 'ACEPTADO')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md px-3.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aceptar Fichaje
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => handleRespondOffer(offer.id, 'RECHAZADO')}
                        className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-bold text-xs flex items-center gap-1.5 px-3"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* HISTORIAL DE TRANSFERENCIAS */}
      <Card className="border-[var(--border-card)] bg-[var(--bg-card)]">
        <CardHeader className="border-b border-[var(--border-card)]">
          <CardTitle className="text-lg font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Mi Historial de Movimientos y Contratos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {history.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] text-xs">
              No registras transferencias históricas en tu perfil.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="p-3.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-main)] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <ArrowRightLeft className="w-4 h-4 text-[var(--accent-cyan)]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-muted)]">{h.fromTeamName || 'Agente Libre'}</span>
                        <span className="text-[var(--accent-cyan)] font-black">➔</span>
                        <span className="font-extrabold text-[var(--text-heading)]">{h.toTeamName}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        Disciplina: {h.gameSlug?.toUpperCase()} • Tipo: {h.transferType || 'LIBRE'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-[var(--text-muted)]">
                    {new Date(h.signedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
