'use client';

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BarChart3, CalendarCheck, Eye, History, MessageSquare, Shield, Shirt, Sparkles, Trophy, UserPlus, Users } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import { initialTeams, type TeamData } from '@/lib/data-store';
import { findManagedTeamForUser } from '@/lib/authenticated-navigation';
import { ManagementHero, ManagementMetrics, ManagementPage, ManagementSection, MetricCard } from '@/components/dashboard/management-ui';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChatSystem } from '@/components/chat/chat-system';
import { ClubSettingsView } from '@/components/club/club-settings-view';
import { MatchdayReportView } from '@/components/matches/matchday-report-view';
import { TeamProfileView } from '@/components/teams/team-profile-view';
import { SquadRosterModal } from '@/components/teams/squad-roster-modal';
import { TransferMarket } from '@/components/transfers/transfer-market';
import { getTeamSquadAction, type SquadMemberData } from '@/app/actions/squads';

export const CLUB_SECTIONS = ['resumen', 'ficha', 'plantilla', 'fichajes', 'matchday', 'estadisticas', 'historial', 'mensajes', 'ajustes'] as const;
export type ClubWorkspaceSection = (typeof CLUB_SECTIONS)[number];

const sectionCopy: Record<ClubWorkspaceSection, { eyebrow: string; title: string; description: string }> = {
  resumen: { eyebrow: 'Centro de gestión', title: 'Panel del club', description: 'Estado de la escuadra, plantilla y accesos operativos de la disciplina activa.' },
  ficha: { eyebrow: 'Identidad institucional', title: 'Ficha del club', description: 'Revisa la presentación completa del equipo y su versión pública.' },
  plantilla: { eyebrow: 'Gestión deportiva', title: 'Plantilla del club', description: 'Consulta la nómina registrada y administra altas, roles y posiciones.' },
  fichajes: { eyebrow: 'Mercado competitivo', title: 'Vacantes y fichajes', description: 'Publica necesidades, revisa atletas disponibles y gestiona oportunidades.' },
  matchday: { eyebrow: 'Operación competitiva', title: 'Convocatorias y matchday', description: 'Encuentros, filtros y reportes de resultados asociados al equipo.' },
  estadisticas: { eyebrow: 'Análisis del club', title: 'Estadísticas del equipo', description: 'Capacidad de plantilla, actividad competitiva y datos consolidados del club.' },
  historial: { eyebrow: 'Memoria institucional', title: 'Historial del club', description: 'Palmarés, competición actual y principales hitos registrados.' },
  mensajes: { eyebrow: 'Comunicación interna', title: 'Chat del club', description: 'Conversaciones de plantilla, fichajes y coordinación competitiva.' },
  ajustes: { eyebrow: 'Administración', title: 'Configuración del club', description: 'Actualiza identidad, imágenes, datos institucionales y presencia digital.' },
};

export function ClubWorkspaceView({ gameSlug, section = 'resumen' }: { gameSlug: string; section?: ClubWorkspaceSection }) {
  const { currentUser, userTeams, refetchTeams } = useAuth();
  const game = GAMES_CATALOG[gameSlug] || GAMES_CATALOG.eafc26;
  const base = `/${game.slug}/club`;
  const copy = sectionCopy[section];
  const team = useMemo(() => findManagedTeamForUser(userTeams.length ? userTeams : initialTeams, currentUser, game.slug), [currentUser, game.slug, userTeams]);
  const [squad, setSquad] = useState<SquadMemberData[]>([]);
  const [isLoadingSquad, setIsLoadingSquad] = useState(true);
  const [isRosterOpen, setIsRosterOpen] = useState(false);

  const loadSquad = useCallback(async () => {
    if (!team?.id) return;
    try {
      const result = await getTeamSquadAction(team.id);
      if (result.success) setSquad(result.squad || []);
    } finally {
      setIsLoadingSquad(false);
    }
  }, [team?.id]);

  useEffect(() => {
    if (['resumen', 'plantilla', 'estadisticas'].includes(section)) void loadSquad();
  }, [loadSquad, section]);

  if (!team) {
    return <ManagementPage className="context-workspace"><ManagementHero eyebrow="Espacio de club" title="Aún no administras un club" description="El panel del club se habilita cuando eres capitán o encargado de una escuadra en esta disciplina." icon={Shield} tone="violet" badge={game.name} /><ManagementSection title="Continúa desde tu espacio de atleta" description="Puedes revisar ofertas, tu ficha o equipos asociados mientras se confirma la vinculación." icon={Sparkles} tone="cyan"><WorkspaceEmpty icon={Shield} title={`Sin club administrable en ${game.name}`} description="Si ya perteneces a uno, solicita al capitán que te registre como encargado." action={<Link href={`/${game.slug}/atleta`}><Button>Ir a mi panel de atleta<ArrowRight className="size-4" /></Button></Link>} /></ManagementSection></ManagementPage>;
  }

  const publicTeamHref = `/${game.slug}/equipos/${team.id}`;
  const memberCount = squad.length || team.membersCount || team.members?.length || 0;
  const capacity = team.maxMembers || Math.max(memberCount, 1);

  return (
    <ManagementPage className="context-workspace">
      <ManagementHero eyebrow={copy.eyebrow} title={copy.title} description={copy.description} icon={Shield} tone="violet" badge={game.name} actions={<Link href={publicTeamHref}><Button variant="outline" className="w-full sm:w-auto"><Eye className="size-4" />Ver ficha pública</Button></Link>}>
        <div className="context-workspace-identity"><Avatar fallback={team.tag || team.name} src={team.logoUrl} status="online" size="lg" /><div><strong>{team.name}</strong><span>{team.tag} · {team.platform}</span></div><Badge variant={team.status === 'ACTIVO' ? 'emerald' : 'slate'}>{team.status}</Badge></div>
      </ManagementHero>

      {!['mensajes', 'ajustes', 'ficha', 'matchday', 'fichajes'].includes(section) ? <ManagementMetrics><MetricCard label="Plantilla" value={memberCount} hint={`Capacidad: ${capacity}`} icon={Users} tone="cyan" /><MetricCard label="Vacantes" value={Math.max(capacity - memberCount, 0)} hint="Cupos disponibles" icon={UserPlus} tone="violet" /><MetricCard label="Competición" value={team.disputando || '—'} hint="Circuito vigente" icon={Trophy} tone="gold" /><MetricCard label="Palmarés" value={team.palmares || '—'} hint="Registro del club" icon={History} tone="emerald" /></ManagementMetrics> : null}

      {section === 'resumen' ? <ClubOverview base={base} team={team} memberCount={memberCount} /> : null}
      {section === 'ficha' ? <div className="context-workspace-embedded"><TeamProfileView team={team} brandColor={game.brandColor} context="game" backHref={base} backLabel="Volver al panel" /></div> : null}
      {section === 'plantilla' ? <ClubRoster team={team} squad={squad} loading={isLoadingSquad} onManage={() => setIsRosterOpen(true)} /> : null}
      {section === 'fichajes' ? <div className="context-workspace-embedded"><TransferMarket game={game} /></div> : null}
      {section === 'matchday' ? <div className="context-workspace-embedded"><MatchdayReportView /></div> : null}
      {section === 'estadisticas' ? <ClubStats team={team} memberCount={memberCount} capacity={capacity} /> : null}
      {section === 'historial' ? <ClubHistory team={team} /> : null}
      {section === 'mensajes' ? <ManagementSection title="Conversaciones del club" description="Coordinación interna y contactos de mercado." icon={MessageSquare} tone="violet" className="[&>div:last-child]:p-0"><Suspense fallback={<WorkspaceLoading />}><ChatSystem /></Suspense></ManagementSection> : null}
      {section === 'ajustes' ? <div className="context-workspace-embedded"><ClubSettingsView team={team} activeGameSlug={game.slug} refetchTeams={refetchTeams} /></div> : null}

      <SquadRosterModal isOpen={isRosterOpen} onClose={() => setIsRosterOpen(false)} team={{ id: team.id, name: team.name, tag: team.tag, game_slug: team.gameSlug, members_count: memberCount, max_members: capacity, logo_text: team.logoText, logo_url: team.logoUrl }} onRosterUpdated={() => void loadSquad()} />
    </ManagementPage>
  );
}

function ClubOverview({ base, team, memberCount }: { base: string; team: TeamData; memberCount: number }) {
  const shortcuts: Array<{ href: string; label: string; detail: string; icon: LucideIcon }> = [{ href: `${base}/plantilla`, label: 'Plantilla', detail: `${memberCount} integrantes registrados`, icon: Shirt }, { href: `${base}/fichajes`, label: 'Fichajes', detail: 'Vacantes y mercado', icon: UserPlus }, { href: `${base}/matchday`, label: 'Matchday', detail: 'Partidos y reportes', icon: CalendarCheck }, { href: `${base}/mensajes`, label: 'Chat del club', detail: 'Coordina la escuadra', icon: MessageSquare }];
  return <div className="context-workspace-grid">{shortcuts.map(({ href, label, detail, icon: Icon }) => <Link key={href} href={href} className="context-workspace-shortcut"><Icon /><div><strong>{label}</strong><span>{detail}</span></div><ArrowRight /></Link>)}<ManagementSection title="Estado institucional" description="Información esencial de la escuadra." icon={Shield} tone="violet" className="context-workspace-wide"><div className="context-workspace-facts"><div><span>Capitán</span><strong>{team.captainName || 'Sin asignar'}</strong></div><div><span>Disciplina</span><strong>{team.gameSlug}</strong></div><div><span>Plataforma</span><strong>{team.platform}</strong></div><div><span>Estado</span><strong>{team.status}</strong></div></div></ManagementSection></div>;
}

function ClubRoster({ team, squad, loading, onManage }: { team: TeamData; squad: SquadMemberData[]; loading: boolean; onManage: () => void }) {
  return <ManagementSection title="Nómina registrada" description="Integrantes, roles y posiciones del club." icon={Users} tone="cyan" action={<Button onClick={onManage}><UserPlus className="size-4" />Administrar plantilla</Button>}>{loading ? <WorkspaceLoading /> : squad.length ? <div className="context-record-list">{squad.map((member) => <article key={member.id}><Avatar fallback={member.gamertag || member.user_name} src={member.avatar_url || member.foto || undefined} size="md" /><div><strong>{member.gamertag || member.user_name}</strong><span>{member.tactical_position || 'Sin posición'} · {member.role_in_team}</span><small>Desde {new Date(member.joined_at).toLocaleDateString('es-CL')}</small></div><Badge variant={member.role_in_team.includes('Cap') ? 'gold' : 'cyan'}>{member.role_in_team}</Badge></article>)}</div> : <WorkspaceEmpty icon={Users} title="Plantilla sin integrantes visibles" description={`Abre la gestión de ${team.name} para agregar jugadores.`} action={<Button onClick={onManage}>Gestionar plantilla</Button>} />}</ManagementSection>;
}

function ClubStats({ team, memberCount, capacity }: { team: TeamData; memberCount: number; capacity: number }) {
  const occupancy = Math.min(Math.round((memberCount / Math.max(capacity, 1)) * 100), 100);
  const profile = team.description && team.logoUrl ? 100 : team.description || team.logoUrl ? 65 : 30;
  return <ManagementSection title="Indicadores disponibles" description="Datos calculados a partir de la configuración y plantilla registradas." icon={BarChart3} tone="emerald"><div className="context-progress-list">{[{ label: 'Ocupación de plantilla', value: occupancy }, { label: 'Perfil institucional', value: profile }].map((bar) => <div key={bar.label}><div><span>{bar.label}</span><strong>{bar.value}%</strong></div><div><i style={{ width: `${bar.value}%` }} /></div></div>)}</div></ManagementSection>;
}

function ClubHistory({ team }: { team: TeamData }) {
  const entries = [{ title: 'Competición vigente', detail: team.disputando || 'Sin competición registrada' }, { title: 'Palmarés', detail: team.palmares || 'Sin títulos registrados' }, { title: 'Estado institucional', detail: team.status }];
  return <ManagementSection title="Registro del club" description="Hitos e información histórica disponible." icon={History} tone="gold"><div className="context-timeline">{entries.map((entry) => <div key={entry.title}><i /><div><strong>{entry.title}</strong><span>{entry.detail}</span></div></div>)}</div></ManagementSection>;
}

function WorkspaceLoading() { return <div className="context-workspace-loading">Cargando información...</div>; }
function WorkspaceEmpty({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) { return <div className="context-workspace-empty"><Icon /><strong>{title}</strong><span>{description}</span>{action}</div>; }
