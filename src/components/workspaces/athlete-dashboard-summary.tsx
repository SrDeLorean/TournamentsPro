'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, BriefcaseBusiness, CalendarDays, FileText, MessageSquare, Shield, Trophy, User, Users } from 'lucide-react';

import { ManagementSection } from '@/components/dashboard/management-ui';
import type { PlayerData } from '@/components/players/player-profile-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface AthleteTeamSummary {
  id: string;
  name: string;
  tag: string;
  gameSlug: string;
  tacticalPosition: string;
  roleInTeam: string;
  organizations: Array<{ id: string; name: string; competitions: string[] }>;
}

export interface AthleteMatchSummary {
  id: string;
  teamHomeId?: string | null;
  homeTeamId?: string | null;
  teamAwayId?: string | null;
  awayTeamId?: string | null;
  home_team_name: string;
  away_team_name: string;
  scoreHome?: number | null;
  scoreAway?: number | null;
  scheduled_at?: string | null;
  status: string;
}

export function AthleteOverview({ base, player, teams, matches, offerCount }: { base: string; player: PlayerData; teams: AthleteTeamSummary[]; matches: AthleteMatchSummary[]; offerCount: number }) {
  const shortcuts = [
    { href: `${base}/ficha`, label: 'Ficha pública', detail: 'Revisa tu presentación', icon: User },
    { href: `${base}/estadisticas`, label: 'Rendimiento', detail: 'Analiza tus métricas', icon: BarChart3 },
    { href: `${base}/ofertas`, label: 'Contratos', detail: 'Gestiona propuestas', icon: FileText },
    { href: `${base}/mensajes`, label: 'Mensajes', detail: 'Habla con clubes', icon: MessageSquare },
  ];
  const finished = matches.filter((match) => ['FINALIZADO', 'FINALIZADA', 'COMPLETADO'].includes(match.status.toUpperCase())).slice(0, 3);
  const upcoming = matches.filter((match) => !['FINALIZADO', 'FINALIZADA', 'COMPLETADO', 'CANCELADO'].includes(match.status.toUpperCase())).sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()).slice(0, 3);
  return <div className="context-workspace-grid">{shortcuts.map(({ href, label, detail, icon: Icon }) => <Link key={href} href={href} className="context-workspace-shortcut"><Icon /><div><strong>{label}</strong><span>{detail}</span></div><ArrowRight /></Link>)}<ManagementSection title="Situación deportiva" description="Resumen de todos tus vínculos, independiente de la organización." icon={Shield} tone="cyan" className="context-workspace-wide"><div className="context-workspace-facts"><div><span>Equipos vinculados</span><strong>{teams.length || (player.teamId ? 1 : 0)}</strong></div><div><span>Ofertas pendientes</span><strong>{offerCount}</strong></div><div><span>Posición</span><strong>{player.position}</strong></div><div><span>Estado</span><strong>{player.status || 'Disponible'}</strong></div></div></ManagementSection><MatchSummarySection title="Últimos resultados" matches={finished} empty="Aún no hay resultados registrados para tus equipos." /><MatchSummarySection title="Próximos partidos" matches={upcoming} empty="No tienes partidos próximos programados." /></div>;
}

function MatchSummarySection({ title, matches, empty }: { title: string; matches: AthleteMatchSummary[]; empty: string }) {
  return <ManagementSection title={title} description="Calendario asociado a tus equipos en esta disciplina." icon={CalendarDays} tone="cyan" className="context-workspace-wide">{matches.length ? <div className="context-record-list">{matches.map((match) => <article key={match.id}><div className="context-record-icon"><Trophy /></div><div><strong>{match.home_team_name} vs {match.away_team_name}</strong><span>{match.scheduled_at ? new Date(match.scheduled_at).toLocaleString('es-CL') : 'Fecha por confirmar'}</span></div><Badge variant={match.status.toUpperCase().includes('FINAL') ? 'slate' : 'cyan'}>{match.scoreHome ?? '—'} - {match.scoreAway ?? '—'}</Badge></article>)}</div> : <SummaryEmpty icon={CalendarDays} title={empty} description="La información aparecerá cuando la organización publique o cierre encuentros." />}</ManagementSection>;
}

export function AthleteTeams({ player, gameSlug, teams }: { player: PlayerData; gameSlug: string; teams: AthleteTeamSummary[] }) {
  return <ManagementSection title="Vínculos de plantilla" description="Equipos y organizaciones registrados de forma independiente para la disciplina activa." icon={Users} tone="cyan">{teams.length ? <div className="space-y-3">{teams.map((team) => <div key={team.id} className="context-team-card"><Shield /><div><strong>{team.name}</strong><span>{team.roleInTeam || player.role || 'Jugador'} · {team.tacticalPosition || player.position}</span><small className="mt-1 block text-[10px] text-[var(--text-muted)]">{team.organizations?.map((organization) => `${organization.name}${organization.competitions.length ? `: ${organization.competitions.join(', ')}` : ''}`).join(' · ') || 'Sin competencia vinculada'}</small></div><Link href={`/${gameSlug}/equipos/${team.id}`}><Button variant="outline">Abrir ficha pública<ArrowRight className="size-4" /></Button></Link></div>)}</div> : player.teamId ? <div className="context-team-card"><Shield /><div><strong>{player.teamName}</strong><span>{player.role || 'Jugador'} · {player.position}</span></div><Link href={`/${gameSlug}/equipos/${player.teamId}`}><Button variant="outline">Abrir ficha pública<ArrowRight className="size-4" /></Button></Link></div> : <SummaryEmpty icon={BriefcaseBusiness} title="Actualmente eres agente libre" description="Mantén tu ficha actualizada para recibir propuestas de clubes." />}</ManagementSection>;
}

function SummaryEmpty({ icon: Icon, title, description }: { icon: typeof CalendarDays; title: string; description: string }) {
  return <div className="context-workspace-empty"><Icon /><strong>{title}</strong><span>{description}</span></div>;
}
