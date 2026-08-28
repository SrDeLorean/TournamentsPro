import React from 'react';
import { queryDB } from '@/lib/db';
import { CompetitionData } from '@/app/actions/competitions';
import { CompetitionsListClient } from './competitions-client';
import { getServerUserSession, requireServerActor } from '@/lib/auth-server';

export const revalidate = 0; // Dynamic RSC rendering

async function getOrganizerCompetitions(): Promise<CompetitionData[]> {
  try {
    const session = await getServerUserSession();

    // Administradores pueden ver todas las competencias
    if (session?.role === 'Administrador') {
      return await queryDB<CompetitionData>(`
        SELECT * FROM competitions 
        ORDER BY created_at DESC
      `);
    }

    // Organizadores u otros usuarios: Filtrar ESTRICTAMENTE por la Organización del usuario
    if (session?.organizationId || session?.userId) {
      return await queryDB<CompetitionData>(
        `SELECT * FROM competitions 
         WHERE organization_id = ? OR organizer_id = ?
         ORDER BY created_at DESC`,
        [session.organizationId || 'NONE', session.userId]
      );
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
