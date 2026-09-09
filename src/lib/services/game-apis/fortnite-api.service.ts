import { ExtractedTeam, ExtractedPlayer, GameApiSearchResult } from './types';

/**
 * Conector para Fortnite-API (Epic Games)
 */
export async function searchFortniteTeamOrPlayer(query: string): Promise<GameApiSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { success: false, teams: [], message: 'Ingresa la Escuadra o Nombre de Usuario Epic Games', sourceApi: 'Fortnite-API', query };
  }

  const fnKey = process.env.FORTNITE_API_KEY || '';

  try {
    let roster: ExtractedPlayer[] = [];
    if (fnKey) {
      const res = await fetch(`https://fortnite-api.com/v2/stats/br/v2?name=${encodeURIComponent(trimmed)}`, {
        headers: { 'Authorization': fnKey },
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.data) {
          roster = [
            {
              gamertag: data.data.account?.name || trimmed,
              name: data.data.account?.name,
              position: 'IGL',
              rankTitle: `Nivel ${data.data.battlePass?.level || 100}`,
              stats: {
                wins: data.data.stats?.all?.overall?.wins || 0,
                kd: data.data.stats?.all?.overall?.kd || 0,
              },
            },
          ];
        }
      }
    }

    const cleanTag = trimmed.substring(0, 3).toUpperCase();
    return {
      success: true,
      teams: [
        {
          teamName: trimmed.toUpperCase(),
          tag: cleanTag,
          gameSlug: 'fortnite',
          platform: 'CROSSPLAY',
          description: `Escuadra Battle Royale Fortnite (${trimmed})`,
          division: 'Arena Competitiva',
          record: { wins: 0, losses: 0 },
          roster,
          sourceApi: 'Fortnite-API',
        },
      ],
      players: roster,
      sourceApi: 'Fortnite-API',
      query,
    };
  } catch (err: any) {
    console.error('Error en búsqueda de Fortnite:', err);
    return {
      success: false,
      teams: [],
      message: `Error al consultar la API de Fortnite: ${err.message || 'Error de conexión'}`,
      sourceApi: 'Fortnite-API',
      query,
    };
  }
}
