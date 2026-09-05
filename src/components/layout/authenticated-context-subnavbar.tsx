'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { initialTeams } from '@/lib/data-store';
import { CreateTeamModal } from '@/components/teams/create-team-modal';
import {
  findManagedTeamForUser,
  getAthleteNavigation,
  getClubNavigation,
  isAuthenticatedNavItemActive,
  type AuthenticatedNavItemId,
} from '@/lib/authenticated-navigation';
import {
  Award,
  Activity,
  BarChart2,
  BriefcaseBusiness,
  FileText,
  History,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Settings,
  Shield,
  Sparkles,
  User,
  Users,
} from 'lucide-react';

type Context = 'athlete' | 'club';

const iconById: Record<AuthenticatedNavItemId, React.ReactNode> = {
  'athlete-dashboard': <LayoutDashboard className="h-3.5 w-3.5" />,
  profile: <User className="h-3.5 w-3.5" />,
  stats: <BarChart2 className="h-3.5 w-3.5" />,
  offers: <FileText className="h-3.5 w-3.5" />,
  teams: <BriefcaseBusiness className="h-3.5 w-3.5" />,
  'athlete-history': <History className="h-3.5 w-3.5" />,
  messages: <MessageSquare className="h-3.5 w-3.5" />,
  'athlete-settings': <Settings className="h-3.5 w-3.5" />,
  'club-dashboard': <LayoutDashboard className="h-3.5 w-3.5" />,
  'club-profile': <Shield className="h-3.5 w-3.5" />,
  roster: <Users className="h-3.5 w-3.5" />,
  recruitment: <Sparkles className="h-3.5 w-3.5" />,
  matchday: <Award className="h-3.5 w-3.5" />,
  'club-stats': <Activity className="h-3.5 w-3.5" />,
  'club-history': <History className="h-3.5 w-3.5" />,
  'club-messages': <MessageSquare className="h-3.5 w-3.5" />,
  'club-settings': <Settings className="h-3.5 w-3.5" />,
};

const NAV_GROUP_STARTS = new Set<AuthenticatedNavItemId>(['offers', 'messages', 'recruitment', 'club-messages']);

export function AuthenticatedContextSubnavbar({ gameSlug }: { gameSlug: string }) {
  const pathname = usePathname();
  const { currentUser, userTeams, refetchTeams } = useAuth();
  const teamsPool = userTeams?.length ? userTeams : initialTeams;
  const myTeam = findManagedTeamForUser(teamsPool, currentUser, gameSlug);

  const [preferredContext, setPreferredContext] = useState<Context>(() => (myTeam ? 'club' : 'athlete'));
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
  const routeContext: Context | null = pathname.startsWith(`/${gameSlug}/club`)
    ? 'club'
    : pathname.startsWith(`/${gameSlug}/atleta`)
      ? 'athlete'
      : null;
  const context = routeContext ?? preferredContext;

  if (!currentUser) return null;

  const athleteItems = getAthleteNavigation(gameSlug, currentUser.id);
  const clubItems = myTeam ? getClubNavigation(gameSlug, myTeam.id) : [];
  const items = context === 'club' && myTeam ? clubItems : athleteItems;

  return (
    <div className="authenticated-context-nav ui-navigation-tier">
      <div className="mx-auto flex h-12 max-w-[96rem] items-center gap-2 px-3 sm:px-4 lg:px-6">
        <div className="flex flex-shrink-0 items-center rounded-xl border border-[var(--border-card)] bg-[var(--bg-main)] p-1" role="tablist" aria-label="Cambiar espacio de trabajo">
          <Link
            href={`/${gameSlug}/atleta`}
            role="tab"
            aria-selected={context === 'athlete'}
            onClick={() => setPreferredContext('athlete')}
            className={`authenticated-context-tab ${context === 'athlete' ? 'authenticated-context-tab-active' : ''}`}
          >
            <User className="h-3.5 w-3.5" />
            Atleta
          </Link>
          {myTeam ? (
            <Link
              href={`/${gameSlug}/club`}
              role="tab"
              aria-selected={context === 'club'}
              onClick={() => setPreferredContext('club')}
              className={`authenticated-context-tab ${context === 'club' ? 'authenticated-context-tab-active authenticated-context-tab-club' : ''}`}
            >
              <Shield className="h-3.5 w-3.5" />
              Club
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreateClubOpen(true)}
              className="authenticated-context-tab authenticated-context-tab-create"
              aria-label={`Crear club en ${gameSlug}`}
            >
              <Plus className="h-3.5 w-3.5" />
              Crear club
            </button>
          )}
        </div>

        <div className="h-5 w-px flex-shrink-0 bg-[var(--border-card)]" />

        <nav className="scrollbar-none flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label={context === 'club' ? 'Gestión del club' : 'Espacio del atleta'}>
          {items.map((item) => {
            const isActive = isAuthenticatedNavItemActive(pathname, item);
            return (
              <React.Fragment key={item.id}>
                {NAV_GROUP_STARTS.has(item.id) ? <span className="authenticated-context-divider" aria-hidden="true" /> : null}
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.label}
                  className={`authenticated-context-link ${isActive ? 'authenticated-context-link-active' : ''}`}
                >
                  {iconById[item.id]}
                  <span>{item.shortLabel}</span>
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        <span className="hidden max-w-36 flex-shrink-0 truncate text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] xl:block">
          {context === 'club' && myTeam ? myTeam.name : `@${currentUser.gamertag || 'atleta'}`}
        </span>
      </div>
      <CreateTeamModal
        isOpen={isCreateClubOpen}
        onClose={() => setIsCreateClubOpen(false)}
        defaultGameSlug={gameSlug}
        onSuccess={() => refetchTeams()}
      />
    </div>
  );
}
