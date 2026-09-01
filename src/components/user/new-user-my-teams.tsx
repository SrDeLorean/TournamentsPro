'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Shield, ExternalLink, Trophy } from 'lucide-react';
import { getUserEnrolledTeamsAction } from '@/app/actions/new-squads';

type EnrolledTeam = Awaited<ReturnType<typeof getUserEnrolledTeamsAction>>['teams'][number];

export function NewUserMyTeamsView() {
  const { currentUser } = useAuth();
  const [teams, setTeams] = useState<EnrolledTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeams = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const res = await getUserEnrolledTeamsAction(currentUser.id);
      if (res.success) setTeams(res.teams);
    } catch {}
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const timer = window.setTimeout(() => void loadTeams(), 0);
    return () => window.clearTimeout(timer);
  }, [currentUser?.id, loadTeams]);

  if (loading) return <div className="skeleton h-64 rounded-xl" />;

  if (teams.length === 0) {
    return (
      <Card className="glass-card border-white/5 bg-black/40 text-center py-16">
        <Shield className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-[var(--text-muted)] text-sm">No perteneces a ningún equipo actualmente.</p>
        <Button className="mt-4" variant="secondary">
          <Link href="/eafc26/reclutamiento">Buscar Club</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-[var(--primary)]" /> Mis Equipos
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => (
          <Card key={team.team_id} className="glass-card border-white/5 bg-black/40 hover:border-[var(--primary)]/50 transition-all overflow-hidden group">
            <div className="h-24 bg-gradient-to-br from-black/80 to-[var(--primary)]/20 relative">
              <div className="absolute inset-0 bg-[url('/images/ui/grid-pattern.svg')] opacity-20 mix-blend-overlay"></div>
            </div>
            
            <div className="relative px-6 -mt-12 mb-4">
              <Avatar src={team.logo_url || undefined} fallback={team.team_name} className="w-24 h-24 border-4 border-black bg-black rounded-xl shadow-xl" />
            </div>

            <CardContent className="space-y-4">
              <div>
                <CardTitle className="text-xl font-black">{team.team_name}</CardTitle>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono">[{team.team_tag}]</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> COMPETICIONES INSCRITAS:
                </p>
                <div className="flex flex-wrap gap-2">
                  {team.organizations.map((org: unknown, idx: number) => {
                    const orgObj = typeof org === 'object' && org !== null ? (org as { id?: string; name?: string; acronym?: string }) : null;
                    const orgName = orgObj ? orgObj.name || orgObj.acronym || 'Organización' : String(org);
                    const orgKey = orgObj ? orgObj.id || orgName : `${orgName}-${idx}`;
                    return (
                      <Badge key={orgKey} variant="cyan" className="text-xs font-mono bg-black/50 border-white/10 text-white/70">
                        {orgName}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2 pb-6 px-6">
              <Button className="w-full bg-white/5 hover:bg-[var(--primary)] hover:text-white transition-colors border border-white/10" variant="outline">
                <Link href={`/eafc26/equipos/${team.team_id}`} className="w-full flex items-center justify-center">
                  Ver Ficha del Club <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
