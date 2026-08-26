'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { initialTeams, type TeamData } from '@/lib/data-store';
import { Shield, Users, Sparkles, Award, Settings, LayoutDashboard, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClubManagementModal } from '@/components/teams/club-management-modal';

export function TeamClubSubnavbar() {
  const pathname = usePathname();
  const { currentUser, activeGameSlug, userTeams } = useAuth();
  const [isClubManageOpen, setIsClubManageOpen] = useState(false);

  if (!currentUser) return null;

  const uId = currentUser.id;
  const uName = currentUser.name?.toLowerCase();
  const uGamer = currentUser.gamertag?.toLowerCase();

  const teamsPool = userTeams && userTeams.length > 0 ? userTeams : initialTeams;

  // Filter team where user is Captain or Encargado or Admin
  type ManagedTeam = TeamData & {
    game_slug?: string;
    captain_id?: string;
    captain_name?: string;
    encargados?: unknown;
    encargados_json?: unknown;
  };

  const isUserTeamManager = (t: ManagedTeam) => {
    if (!t) return false;
    const slug = t.game_slug || t.gameSlug || 'eafc26';
    if (slug !== activeGameSlug && activeGameSlug !== 'ALL') return false;

    const cId = t.captain_id || t.captainId;
    const cName = (t.captain_name || t.captainName || '').toLowerCase();

    // 1. Official Captain Check
    if (cId && cId === uId) return true;
    if (cName && (cName === uName || cName === uGamer)) return true;
    if (currentUser.teamId && t.id === currentUser.teamId) return true;

    // 2. N Encargados Check
    const encs = t.encargados || t.encargados_json;
    if (encs) {
      try {
        const arr = typeof encs === 'string' ? JSON.parse(encs) : encs;
        if (Array.isArray(arr)) {
          const isEnc = arr.some((enc: unknown) => {
            if (typeof enc === 'string') return enc === uId || enc.toLowerCase() === uName || enc.toLowerCase() === uGamer;
            if (!enc || typeof enc !== 'object') return false;
            const manager = enc as { id?: string; name?: string; gamertag?: string };
            return (
              manager.id === uId ||
              (manager.name && uName && manager.name.toLowerCase() === uName) ||
              (manager.gamertag && uGamer && manager.gamertag.toLowerCase() === uGamer)
            );
          });
          if (isEnc) return true;
        }
      } catch {}
    }

    // 3. Fallback for Admin/Organizer
    if (currentUser.role === 'Administrador' || currentUser.role === 'Organizador') {
      return true;
    }

    return false;
  };

  const myTeam = (teamsPool as ManagedTeam[]).find(isUserTeamManager);
  if (!myTeam) return null;

  const teamOptions = [
    { href: `/${activeGameSlug}/equipos/${myTeam.id}`, label: 'Dashboard Club', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { href: `/${activeGameSlug}/plantilla`, label: 'Plantilla Roster', icon: <Users className="w-3.5 h-3.5" />, badge: `${myTeam.membersCount || 0}` },
    { href: `/${activeGameSlug}/reclutamiento`, label: 'Vacantes & Fichajes', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { href: `/${activeGameSlug}/matchday`, label: 'Convocatorias', icon: <Award className="w-3.5 h-3.5" /> },
    { href: `/${activeGameSlug}/ajustes`, label: 'Ajustes Club', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      <div className="w-full bg-slate-950/90 border-b border-purple-500/30 backdrop-blur-md z-20 py-1.5 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
          
          {/* Label Badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              🛡️ OPCIONES DEL EQUIPO (CLUB):
            </span>
            <Badge variant="violet" className="text-[9px] px-2 py-0.5 font-mono font-black uppercase shadow-sm">
              {myTeam.name}
            </Badge>

            <Button
              size="sm"
              onClick={() => setIsClubManageOpen(true)}
              className="text-[10px] font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white h-6 px-2 rounded-lg flex items-center gap-1 shadow-md ml-1"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Gestión Rápida</span>
            </Button>
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

      {/* Modal interactivo de gestion de club */}
      {isClubManageOpen && (
        <ClubManagementModal
          isOpen={isClubManageOpen}
          onClose={() => setIsClubManageOpen(false)}
          team={myTeam}
        />
      )}
    </>
  );
}
