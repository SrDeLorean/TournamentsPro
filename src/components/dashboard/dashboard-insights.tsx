'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Building2, CalendarDays, Fingerprint, Shield, ShieldAlert, Trophy, Users } from 'lucide-react';

import { ManagementMetrics, ManagementSection, MetricCard } from '@/components/dashboard/management-ui';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import type { DashboardInsights, IdentityWarning, RecentActivity } from '@/lib/dashboard-insights';
import { GAMES_CATALOG } from '@/lib/games-data';

type DetailKey = 'users' | 'organizations' | 'teams' | 'competitions' | 'sanctions';

function WindowStats({ title, values }: { title: string; values: RecentActivity }) {
  return <section className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-4"><h4 className="text-xs font-black uppercase text-[var(--text-heading)]">{title}</h4><dl className="mt-3 grid grid-cols-3 gap-2"><div><dt className="text-[10px] uppercase text-[var(--text-muted)]">24 horas</dt><dd className="mt-1 text-xl font-black text-[var(--app-accent)]">{values.day}</dd></div><div><dt className="text-[10px] uppercase text-[var(--text-muted)]">7 días</dt><dd className="mt-1 text-xl font-black text-[var(--app-accent)]">{values.week}</dd></div><div><dt className="text-[10px] uppercase text-[var(--text-muted)]">30 días</dt><dd className="mt-1 text-xl font-black text-[var(--app-accent)]">{values.month}</dd></div></dl></section>;
}

function InsightDetail({ insight, detail }: { insight: DashboardInsights; detail: DetailKey }) {
  if (detail === 'users') return <div className="grid gap-3 sm:grid-cols-2"><WindowStats title="Nuevos registros" values={insight.users.newUsers} /><WindowStats title="Usuarios con acceso" values={insight.users.activeUsers} /></div>;
  if (detail === 'organizations') return <div className="space-y-3"><WindowStats title="Nuevas organizaciones" values={insight.organizations.newOrganizations} /><p className="text-xs text-[var(--text-secondary)]">Total dentro de tu alcance: <strong className="text-[var(--text-heading)]">{insight.organizations.total}</strong></p></div>;
  if (detail === 'teams') return <div className="space-y-3"><WindowStats title="Nuevos clubes" values={insight.teams.newTeams} /><p className="text-xs text-[var(--text-secondary)]">Clubes operativos dentro del alcance actual: <strong className="text-[var(--text-heading)]">{insight.teams.total}</strong></p></div>;
  if (detail === 'competitions') return <dl className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-4"><dt className="text-[10px] uppercase text-[var(--text-muted)]">En curso</dt><dd className="mt-1 text-2xl font-black text-[var(--app-accent)]">{insight.competitions.active}</dd></div><div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-4"><dt className="text-[10px] uppercase text-[var(--text-muted)]">Próximas</dt><dd className="mt-1 text-2xl font-black text-[var(--app-warning)]">{insight.competitions.upcoming}</dd></div><div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-4"><dt className="text-[10px] uppercase text-[var(--text-muted)]">Finalizadas</dt><dd className="mt-1 text-2xl font-black text-[var(--text-heading)]">{insight.competitions.finished}</dd></div></dl>;
  return insight.sanctions.length ? <div className="space-y-2">{insight.sanctions.map((sanction) => <article key={`${sanction.type}-${sanction.id}`} className="rounded-xl border border-[var(--app-danger)]/25 bg-[var(--app-danger-soft)] p-3"><div className="flex items-center justify-between gap-3"><strong className="text-sm text-[var(--text-heading)]">{sanction.name}</strong><Badge variant="rose">{sanction.type === 'user' ? 'Usuario' : sanction.type === 'team' ? 'Club' : 'Organización'}</Badge></div><p className="mt-1 text-xs text-[var(--text-secondary)]">{sanction.reason}</p>{sanction.date ? <time className="mt-2 block text-[10px] text-[var(--text-muted)]">{new Date(sanction.date).toLocaleDateString()}</time> : null}</article>)}</div> : <p className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-6 text-center text-sm text-[var(--text-secondary)]">No hay sanciones activas.</p>;
}
const detailTitles: Record<DetailKey, string> = { users: 'Actividad de usuarios', organizations: 'Organizaciones', teams: 'Clubes y plantillas', competitions: 'Estado de competencias', sanctions: 'Sanciones activas' };

export function useDashboardInsights() {
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard/insights');
      const data = await response.json() as { success?: boolean; insights?: DashboardInsights };
      if (response.ok && data.success && data.insights) setInsights(data.insights);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  return { insights, loading, reload };
}

export function DashboardInsightMetrics({ insights, loading = false }: { insights: DashboardInsights | null; loading?: boolean }) {
  const [detail, setDetail] = useState<DetailKey | null>(null);
  const value = (count?: number) => loading ? '…' : count ?? 0;
  return <><ManagementMetrics className="management-metrics-expanded"><MetricCard label="Usuarios" value={value(insights?.users.total)} hint="Actividad y altas" icon={Users} tone="cyan" onClick={() => setDetail('users')} /><MetricCard label="Organizaciones" value={value(insights?.organizations.total)} hint="Entidades en alcance" icon={Building2} tone="violet" onClick={() => setDetail('organizations')} /><MetricCard label="Competencias" value={value(insights?.competitions.total)} hint={`${insights?.competitions.active ?? 0} en curso`} icon={Trophy} tone="gold" onClick={() => setDetail('competitions')} /><MetricCard label="Clubes" value={value(insights?.teams.total)} hint="Plantillas registradas" icon={Shield} tone="cyan" onClick={() => setDetail('teams')} /><MetricCard label="Sanciones activas" value={value(insights?.sanctions.length)} hint="Abrir detalle" icon={ShieldAlert} tone="crimson" onClick={() => setDetail('sanctions')} /></ManagementMetrics>{insights && detail ? <Modal isOpen onClose={() => setDetail(null)} title={detailTitles[detail]} description={insights.scope === 'global' ? 'Datos globales del sistema.' : 'Datos limitados a tu organización.'} size="lg"><InsightDetail insight={insights} detail={detail} /></Modal> : null}</>;
}

export function IdentityWarningsPanel({ warnings, selectedGameSlug }: { warnings: IdentityWarning[]; selectedGameSlug?: string }) {
  const visible = useMemo(() => warnings.filter((warning) => warning.scope === 'global' || !selectedGameSlug || warning.gameSlug === selectedGameSlug), [selectedGameSlug, warnings]);
  return <ManagementSection title="Revisión de identidades similares" description="Advertencias preventivas; cada coincidencia debe validarse manualmente antes de aplicar una medida." icon={Fingerprint} tone="crimson" action={<Badge variant={visible.length ? 'rose' : 'emerald'}>{visible.length} alertas</Badge>}>{visible.length ? <div className="grid gap-3 xl:grid-cols-2">{visible.map((warning) => <article key={warning.id} className="rounded-2xl border border-[var(--app-danger)]/25 bg-[var(--app-danger-soft)] p-4"><div className="flex flex-wrap items-center gap-2"><Badge variant={warning.scope === 'global' ? 'rose' : 'cyan'}>{warning.scope === 'global' ? 'ID global' : GAMES_CATALOG[warning.gameSlug || '']?.name || warning.gameSlug}</Badge><span className="text-[10px] uppercase text-[var(--text-muted)]">Revisión requerida</span></div><div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2"><div><strong className="block text-sm text-[var(--text-heading)]">{warning.firstIdentifier}</strong><span className="text-[10px] text-[var(--text-muted)]">{warning.firstName}</span></div><Activity className="size-4 text-[var(--app-danger)]" /><div><strong className="block text-sm text-[var(--text-heading)]">{warning.secondIdentifier}</strong><span className="text-[10px] text-[var(--text-muted)]">{warning.secondName}</span></div></div><p className="mt-3 border-t border-[var(--border-card)] pt-3 text-xs text-[var(--text-secondary)]">{warning.reason}</p></article>)}</div> : <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-8 text-center"><CalendarDays className="mx-auto size-7 text-[var(--app-positive)]" /><p className="mt-2 text-sm font-bold text-[var(--text-heading)]">Sin coincidencias sospechosas</p><p className="mt-1 text-xs text-[var(--text-muted)]">No se detectaron IDs visualmente similares en este alcance.</p></div>}</ManagementSection>;
}
