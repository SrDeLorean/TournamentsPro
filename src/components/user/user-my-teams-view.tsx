'use client';

import React, { useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GameConfig } from '@/lib/games-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/providers/auth-provider';
import { getUserEnrolledTeamsAction } from '@/app/actions/squads';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import {
  Shield,
  Users,
  Trophy,
  Building2,
  Search,
  Loader2,
} from 'lucide-react';

interface UserMyTeamsViewProps {
  game: GameConfig;
}

type EnrolledTeam = Awaited<ReturnType<typeof getUserEnrolledTeamsAction>>['teams'][number];

export function UserMyTeamsView({ game }: UserMyTeamsViewProps) {
  const gameSlug = game.slug || 'eafc26';
  const { currentUser } = useAuth();

  const [teams, setTeams] = useState<EnrolledTeam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const userId = currentUser?.id;

  const loadUserTeams = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await getUserEnrolledTeamsAction(userId, gameSlug);
      if (res.success && res.teams) {
        setTeams(res.teams);
      } else {
        setTeams([]);
      }
    } catch (e) {
      console.error('Error cargando equipos del usuario:', e);
    } finally {
      setIsLoading(false);
    }
  }, [gameSlug, userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUserTeams(), 0);
    return () => window.clearTimeout(timer);
  }, [loadUserTeams]);

  const filteredTeams = teams.filter((t) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.tag?.toLowerCase().includes(q) ||
      t.captainName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pt-3 sm:pt-4 font-mono">
      {/* HEADER ÚNICO RESTRIGIDO (SOLAMENTE 1 TÍTULO) */}
      <Card className="p-5 bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-black uppercase text-[var(--text-heading)] tracking-wide">
                Mis Equipos & Clubes Inscritos
              </h2>
              <Badge variant="cyan" className="font-mono text-xs font-black">
                {filteredTeams.length} Club{filteredTeams.length === 1 ? '' : 'es'}
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)] max-w-2xl">
              Listado de escuadras eSports en las que compites oficialmente en {game.name}. Muestra tu rol, posición táctica y las Organizaciones en las que está inscrito cada club.
            </p>
          </div>

          {/* Search Toolbar */}
          <div className="relative md:w-72 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por club o tag..."
              className="pl-10 text-xs font-mono bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-heading)]"
            />
          </div>
        </div>
      </Card>

      {/* TEAMS GRID */}
      {isLoading ? (
        <div className="p-12 text-center text-[var(--text-muted)] font-mono text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          Cargando tus escuadras inscritas...
        </div>
      ) : filteredTeams.length === 0 ? (
        <Card className="p-12 text-center space-y-3 font-mono text-xs bg-[var(--bg-card)] border-[var(--border-card)]">
          <Shield className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[var(--text-heading)]">No estás inscrito en ningún equipo de {game.name} aún.</h3>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">
            Acepta ofertas de contrato o crea tu propia escuadra para comenzar a participar en torneos y circuitos oficiales.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link href={`/${gameSlug}/traspasos`}>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs">
                Explorar Mercado de Fichajes
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTeams.map((team) => {
            const isCaptain = team.roleInTeam === 'Capitan' || team.roleInTeam === 'Capitán' || team.captainId === currentUser?.id;
            const isEncargado = team.roleInTeam === 'Encargado';

            return (
              <Card
                key={team.id}
                className="p-5 space-y-4 bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-cyan-500/50 transition-all shadow-xl rounded-2xl relative overflow-hidden group"
              >
                {/* Team Info Header */}
                <div className="flex items-start justify-between gap-4 border-b border-[var(--border-card)] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center justify-center font-black text-base text-cyan-400 shadow-md shrink-0 overflow-hidden">
                      {team.logoUrl ? (
                        <Image
                          src={team.logoUrl}
                          alt={team.name}
                          fill
                          sizes="56px"
                          unoptimized={shouldBypassImageOptimization(team.logoUrl)}
                          className="object-cover rounded-2xl"
                        />
                      ) : (
                        team.tag
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black uppercase text-[var(--text-heading)] group-hover:text-cyan-400 transition-colors">
                          {team.name}
                        </h3>
                        <Badge variant="cyan" className="font-mono text-[10px]">
                          [{team.tag}]
                        </Badge>
                      </div>

                      <span className="text-xs font-mono text-[var(--text-muted)] block mt-0.5">
                        Capitán: <strong className="text-[var(--text-heading)]">{team.captainName}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Role & Dorsal Badge */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge
                      variant={isCaptain ? 'gold' : isEncargado ? 'violet' : 'cyan'}
                      className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 shadow-sm"
                    >
                      {isCaptain ? '👑 Capitán' : isEncargado ? '🛡️ Staff/DT' : '👤 Jugador Roster'}
                    </Badge>

                    <div className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                      #{team.jerseyNumber ?? '—'} • {team.tacticalPosition}
                    </div>
                  </div>
                </div>

                {/* Organizations & Tournaments inside SAME card */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] tracking-wider block">
                    🏛️ ORGANIZACIONES & TORNEOS EN LOS QUE COMPITE ESTE CLUB:
                  </span>

                  {team.organizations && team.organizations.length > 0 ? (
                    <div className="space-y-2">
                      {team.organizations.map((org) => (
                        <div
                          key={org.id}
                          className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-purple-300 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-purple-400" />
                              <span>{org.name}</span>
                            </span>
                            <Badge variant="violet" className="text-[9px] font-mono">
                              {org.acronym || 'ORG'}
                            </Badge>
                          </div>

                          {org.competitions && org.competitions.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {org.competitions.map((compName: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1"
                                >
                                  <Trophy className="w-3 h-3 text-amber-400" />
                                  <span>{compName}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono italic text-[var(--text-muted)] block">
                              Inscrito en la Organización. Sin torneos asignados aún.
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-[11px] font-mono text-[var(--text-muted)] italic">
                      Escuadra en formación. Sin organizaciones de liga asignadas actualmente.
                    </div>
                  )}
                </div>

                {/* Team Card Footer Actions */}
                <div className="pt-2 border-t border-[var(--border-card)] flex items-center justify-between gap-2 text-xs font-mono">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Disciplina: <strong className="text-[var(--text-heading)] uppercase">{team.gameSlug}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <Link href={`/${gameSlug}/plantilla`}>
                      <Button
                        size="sm"
                        className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono h-8 flex items-center gap-1 shadow-md"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Ver Plantilla</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
