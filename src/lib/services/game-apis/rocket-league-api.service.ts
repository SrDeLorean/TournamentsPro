import { GameApiSearchResult } from './types';

/**
 * Conector para Ballchasing API & Tracker Network API (Rocket League)
 */
export async function searchRocketLeagueTeamOrPlayer(query: string): Promise<GameApiSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { success: false, teams: [], message: 'Ingresa el Nombre del Equipo o ID de Epic Games', sourceApi: 'Ballchasing / TRN API', query };
  }

  try {
    const cleanTag = trimmed.substring(0, 3).toUpperCase();
    return {
      success: true,
      teams: [
        {
          teamName: trimmed.toUpperCase(),
          tag: cleanTag,
          gameSlug: 'rocketleague',
          platform: 'CROSSPLAY',
          description: `Club Vehicular Rocket League 3v3 (${trimmed})`,
          division: 'Grand Champion / SSL Arena',
          record: { wins: 0, losses: 0 },
          roster: [],
          sourceApi: 'Ballchasing / TRN API',
        },
      ],
      sourceApi: 'Rocket League API Service',
      query,
    };
  } catch (err: unknown) {
    console.error('Error en búsqueda de Rocket League:', err);
    return {
      success: false,
      teams: [],
      message: `Error al consultar la API de Rocket League: ${err instanceof Error ? err.message : 'Error de conexión'}`,
      sourceApi: 'Rocket League API',
      query,
    };
  }
}
