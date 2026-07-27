'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { initialTeams, TeamData } from '@/lib/data-store';
import { Shield, Users, Sparkles, Award, Settings, LayoutDashboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TeamClubSubnavbar() {
  const pathname = usePathname();
  const { currentUser, activeGameSlug, userTeams } = useAuth();

  // Only render for regular Users/Captains, not Admin/Organizer
  const roleStr = (currentUser?.role || '').toLowerCase();
  if (roleStr === 'administrador' || roleStr === 'admin' || roleStr === 'organizador') {
    return null;
  }

  // Strictly filter user's team for the currently active discipline (gameSlug === activeGameSlug)
  const teamsPool = userTeams && userTeams.length > 0 ? userTeams : initialTeams;
  const myTeam = teamsPool.find(
    (t) =>
      t.gameSlug === activeGameSlug &&
      (t.captainName?.toLowerCase() === currentUser?.name?.toLowerCase() ||
        t.captainName?.toLowerCase() === currentUser?.gamertag?.toLowerCase() ||
        t.id === currentUser?.teamId)
  );

  // If user does not own or belong to a club in THIS active game, do not render club options
  if (!myTeam) return null;

  const teamOptions = [
    { href: `/${activeGameSlug}/equipos/${myTeam.id}`, label: 'Dashboard (Perfil Club)', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { href: `/${activeGameSlug}/plantilla`, label: 'Plantilla del Club', icon: <Users className="w-3.5 h-3.5" />, badge: `${myTeam.membersCount}` },
    { href: `/${activeGameSlug}/reclutamiento`, label: 'Vacantes & Reclutamiento', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { href: `/${activeGameSlug}/matchday`, label: 'Convocatoria Matchday', icon: <Award className="w-3.5 h-3.5" /> },
    { href: `/${activeGameSlug}/ajustes`, label: 'Ajustes del Club', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-full bg-slate-950/90 border-b border-purple-500/30 backdrop-blur-md z-20 py-1.5 px-4 sm:px-6 lg:px-8 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
        
        {/* Label Badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            🛡️ OPCIONES DEL EQUIPO (CLUB):
          </span>
          <Badge variant="violet" className="text-[9px] px-1.5 py-0 font-mono font-bold uppercase">
            {myTeam.name}
          </Badge>
        </div>

        {/* Action Link Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {teamOptions.map((opt) => {
            const isActive = pathname === opt.href;
            return (
              <Link
                key={opt.href}
                href={opt.href}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 flex-shrink-0 shadow-sm border ${
                  isActive
                    ? 'bg-purple-600 text-white border-purple-400 font-black shadow-md'
                    : 'bg-purple-950/70 hover:bg-purple-900 border-purple-500/40 text-purple-200'
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
                {opt.badge && (
                  <span className="text-[9px] font-mono font-black px-1 rounded bg-slate-950 text-purple-300">
                    {opt.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
