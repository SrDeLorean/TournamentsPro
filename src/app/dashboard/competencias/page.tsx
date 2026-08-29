import React from 'react';
import { dbProvider } from '@/lib/db/provider';
import { CompetitionData } from '@/app/actions/competitions';
import { CompetitionsListClient } from './competitions-client';
import { getServerUserSession, requireServerActor } from '@/lib/auth-server';
import type { Competition } from '@/lib/db/interfaces';

export const revalidate = 0; // Dynamic RSC rendering

function mapCompToData(c: Competition): CompetitionData {
  return {
    id: c.id,
    name: c.name,
    game_slug: c.gameSlug,
    organizer_id: c.organizerId,
    organizer_name: c.organizerName,
    organization_id: c.organizationId,
    season_id: c.seasonId,
    prize_pool: c.prizePool,
    transfer_market_mode: c.transferMarketMode as any,
    mode_format: c.modeFormat,
    status: c.status as any,
    fecha_limite_inscripcion: c.fechaLimiteInscripcion,
    fecha_inicio: c.fechaInicio,
    fecha_termino: c.fechaTermino,
    description: c.description,
    created_at: c.createdAt,
  };
}

async function getOrganizerCompetitions(): Promise<CompetitionData[]> {
  try {
    const session = await getServerUserSession();

    // Administradores pueden ver todas las competencias
    if (session?.role === 'Administrador') {
      const comps = await dbProvider.competitions.findAll({
        orderBy: 'created_at',
        orderDirection: 'DESC',
      });
      return comps.map(mapCompToData);
    }

    // Organizadores u otros usuarios: Filtrar ESTRICTAMENTE por la Organización del usuario
    if (session?.organizationId || session?.userId) {
      const [byOrg, byOrganizer] = await Promise.all([
        dbProvider.competitions.findByOrganization(session.organizationId || 'NONE'),
        dbProvider.competitions.findByOrganizer(session.userId)
      ]);
      const combined = [...byOrg, ...byOrganizer];
      const unique = Array.from(new Map(combined.map(c => [c.id, c])).values());
      unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return unique.map(mapCompToData);
    }

    return [];
  } catch (error) {
    console.error('Error fetching competitions in RSC:', error);
    return [];
  }
}

export default async function CompetitionsPage() {
  await requireServerActor(['Administrador', 'Organizador']);
  const session = await getServerUserSession();
  const competitions = await getOrganizerCompetitions();

  return (
    <CompetitionsListClient
      competitions={competitions}
      allowedGames={session?.allowedGames || []}
      userRole={session?.role || 'Jugador'}
    />
  );
}
