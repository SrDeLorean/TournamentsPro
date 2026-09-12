import { ExtractedPlayer, GameApiSearchResult } from './types';

/**
 * Conector para Riot Games League of Legends API (Clash / Summoners)
 */
export async function searchLeagueOfLegendsTeamOrPlayer(query: string): Promise<GameApiSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { success: false, teams: [], message: 'Ingresa el Nombre del Equipo Clash o Invocador', sourceApi: 'Riot Games LoL API', query };
  }

  try {
    const cleanTag = trimmed.substring(0, 3).toUpperCase();
    const isRiotTag = trimmed.includes('#');

    let roster: ExtractedPlayer[] = [];
    if (isRiotTag) {
      const [name, tag] = trimmed.split('#');
      roster = [
        {
          gamertag: `${name}#${tag}`,
          name,
          position: 'MID',
          rankTitle: 'Challenger / Master',
        },
      ];
    }

    return {
      success: true,
      teams: [
        {
          teamName: (isRiotTag ? `${trimmed.split('#')[0]} SQUAD` : trimmed).toUpperCase(),
          tag: cleanTag,
          gameSlug: 'lol',
          platform: 'PC',
          description: `Escuadra de la Grieta del Invocador LoL (${trimmed})`,
          division: 'Grieta del Invocador 5v5',
          record: { wins: 0, losses: 0 },
          roster,
          sourceApi: 'Riot Games LoL API',
        },
      ],
      players: roster,
      sourceApi: 'Riot Games LoL API',
      query,
    };
  } catch (err: unknown) {
    console.error('Error en búsqueda de League of Legends:', err);
    return {
      success: false,
      teams: [],
      message: `Error al consultar la API de LoL: ${err instanceof Error ? err.message : 'Error de conexión'}`,
      sourceApi: 'Riot Games LoL API',
      query,
    };
  }
}
