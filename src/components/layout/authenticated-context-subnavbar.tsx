'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { initialTeams } from '@/lib/data-store';
import {
  findManagedTeamForUser,
  getAthleteNavigation,
  getClubNavigation,
  isAuthenticatedNavItemActive,
  type AuthenticatedNavItemId,
} from '@/lib/authenticated-navigation';
import {
  Award,
  BarChart2,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Shield,
  Sparkles,
  User,
  Users,
} from 'lucide-react';

type Context = 'athlete' | 'club';

const iconById: Record<AuthenticatedNavItemId, React.ReactNode> = {
  profile: <User className="h-3.5 w-3.5" />,
  stats: <BarChart2 className="h-3.5 w-3.5" />,
  offers: <FileText className="h-3.5 w-3.5" />,
  messages: <MessageSquare className="h-3.5 w-3.5" />,
  'athlete-settings': <Settings className="h-3.5 w-3.5" />,
  'club-dashboard': <LayoutDashboard className="h-3.5 w-3.5" />,
  roster: <Users className="h-3.5 w-3.5" />,
  recruitment: <Sparkles className="h-3.5 w-3.5" />,
  matchday: <Award className="h-3.5 w-3.5" />,
  'club-settings': <Settings className="h-3.5 w-3.5" />,
};

export function AuthenticatedContextSubnavbar({ gameSlug }: { gameSlug: string }) {
  const pathname = usePathname();
  const { currentUser, userTeams } = useAuth();
  const teamsPool = userTeams?.length ? userTeams : initialTeams;
  const myTeam = findManagedTeamForUser(teamsPool, currentUser, gameSlug);

  const [context, setContext] = useState<Context>(() => (myTeam ? 'club' : 'athlete'));

  if (!currentUser) return null;

  const athleteItems = getAthleteNavigation(gameSlug, currentUser.id);
  const clubItems = myTeam ? getClubNavigation(gameSlug, myTeam.id) : [];
  const items = context === 'club' && myTeam ? clubItems : athleteItems;

  return (
    <div className="authenticated-context-nav border-b border-[var(--border-card)]">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-shrink-0 items-center rounded-xl border border-[var(--border-card)] bg-[var(--bg-main)] p-1" role="tablist" aria-label="Cambiar espacio de trabajo">
          <button
            type="button"
            role="tab"
            aria-selected={context === 'athlete'}
            onClick={() => setContext('athlete')}
            className={`authenticated-context-tab ${context === 'athlete' ? 'authenticated-context-tab-active' : ''}`}
          >
            <User className="h-3.5 w-3.5" />
            Atleta
          </button>
          {myTeam ? (
            <button
              type="button"
              role="tab"
              aria-selected={context === 'club'}
              onClick={() => setContext('club')}
              className={`authenticated-context-tab ${context === 'club' ? 'authenticated-context-tab-active authenticated-context-tab-club' : ''}`}
            >
              <Shield className="h-3.5 w-3.5" />
              Club
            </button>
          ) : null}
        </div>

        <div className="h-5 w-px flex-shrink-0 bg-[var(--border-card)]" />

        <nav className="scrollbar-none flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label={context === 'club' ? 'Gestión del club' : 'Espacio del atleta'}>
          {items.map((item) => {
            const isActive = isAuthenticatedNavItemActive(pathname, item);
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`authenticated-context-link ${isActive ? 'authenticated-context-link-active' : ''}`}
              >
                {iconById[item.id]}
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </nav>

        <span className="hidden max-w-36 flex-shrink-0 truncate text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] xl:block">
          {context === 'club' && myTeam ? myTeam.name : `@${currentUser.gamertag || 'atleta'}`}
        </span>
      </div>
    </div>
  );
}
