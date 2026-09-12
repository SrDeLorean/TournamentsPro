'use client';

import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, Shield, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRecruitment } from '../use-recruitment';
import { RecruitmentSelector } from './recruitment-selector';
import { RecruitmentSearch } from './recruitment-search';
import { RecruitmentOffers } from './recruitment-offers';
import { RecruitmentVacancy } from './recruitment-vacancy';
import { RecruitmentOfferModal } from './recruitment-offer-modal';

export function RecruitmentPageClient() {
  const state = useRecruitment();
  const { teams, isLoadingTeams, activeTab, feedback, setFeedback } = state;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300 font-mono">
      <PageHeader
        badgeText="Bolsa Abierta de Convocatorias eSports"
        badgeIcon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
        title="VACANTES &"
        highlightTitle="RECLUTAMIENTO."
        description="Emite propuestas de contrato formal, explora atletas disponibles y gestiona las convocatorias de tu escuadra."
      />
      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-mono font-bold flex items-center justify-between border ${
          feedback.type === 'success'
            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
            : 'bg-rose-950/70 text-rose-300 border-rose-500/40'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white" aria-label="Cerrar aviso">
            ✕
          </button>
        </div>
      )}
      {isLoadingTeams ? (
        <div className="p-8 text-center text-[var(--text-muted)] text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          Cargando tus escuadras gestionadas...
        </div>
      ) : teams.length === 0 ? (
        <Card className="border-[var(--border-card)] bg-[var(--bg-card)] p-8 text-center space-y-3">
          <Shield className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-50" />
          <h3 className="text-base font-black uppercase text-[var(--text-heading)]">No gestionas ningún equipo activo</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Para ofertar a jugadores y abrir vacantes de reclutamiento, debes ser Capitán o Encargado de una escuadra.
          </p>
          <Link href="/equipos" className="inline-block mt-2">
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs">
              Crear o Unirte a un Club
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          <RecruitmentSelector state={state} />
          {activeTab === 'SEARCH_PLAYERS' && <RecruitmentSearch state={state} />}
          {activeTab === 'SENT_OFFERS' && <RecruitmentOffers state={state} />}
          {activeTab === 'POST_VACANCY' && <RecruitmentVacancy state={state} />}
        </div>
      )}
      <RecruitmentOfferModal state={state} />
    </div>
  );
}
