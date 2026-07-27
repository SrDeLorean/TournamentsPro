'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/ui/page-header';
import { Settings } from 'lucide-react';
import { ClubSettingsView } from '@/components/club/club-settings-view';
import { TeamData } from '@/lib/data-store';

export default function ClubAjustesPage() {
  const { currentUser, activeGameSlug } = useAuth();
  const [userTeam, setUserTeam] = useState<TeamData | null>(null);

  const fetchTeam = () => {
    fetch(`/api/teams?gameSlug=${activeGameSlug || 'eafc26'}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.teams)) {
          const found = data.teams.find(
            (t: TeamData) =>
              t.id === currentUser?.teamId ||
              (currentUser?.teamName && t.name.toLowerCase() === currentUser.teamName.toLowerCase()) ||
              t.captainId === currentUser?.id
          );
          if (found) {
            setUserTeam(found);
          }
        }
      })
      .catch((err) => console.error('Error fetching team for club settings:', err));
  };

  useEffect(() => {
    fetchTeam();
  }, [activeGameSlug, currentUser]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      <PageHeader
        badgeText="Configuración de Marca & Identidad Institucional"
        badgeIcon={<Settings className="w-3.5 h-3.5 text-purple-400" />}
        title="AJUSTES DEL"
        highlightTitle="CLUB."
        description="Modifica el logo oficial WebP, banner panorámico de portada, etiqueta tag, redes sociales y parámetros eSports de la escuadra en MySQL."
      />

      <ClubSettingsView
        team={userTeam}
        activeGameSlug={activeGameSlug || 'eafc26'}
        refetchTeams={fetchTeam}
      />
    </div>
  );
}
