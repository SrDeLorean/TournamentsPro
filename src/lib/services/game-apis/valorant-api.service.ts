import { ExtractedTeam, ExtractedPlayer, GameApiSearchResult } from './types';

/**
 * Conector para Riot Games API & HenrikDev Valorant API
 */
export async function searchValorantTeamOrPlayer(query: string): Promise<GameApiSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { success: false, teams: [], message: 'Ingresa el Riot ID (Ej: TenZ#1234) o Nombre de Escuadra', sourceApi: 'Riot Games / HenrikDev API', query };
  }

  const apiKey = process.env.HENRIK_VALORANT_API_KEY || process.env.RIOT_API_KEY || '';

  try {
    // Si la consulta contiene '#' es un Riot ID (Ej: Player#TAG)
    if (trimmed.includes('#')) {
      const [name, tag] = trimmed.split('#');
      const accountUrl = `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
      const mmrUrl = `https://api.henrikdev.xyz/valorant/v2/by-puuid/mmr/latam/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;

      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (apiKey) headers['Authorization'] = apiKey;

      const accRes = await fetch(accountUrl, { headers, next: { revalidate: 300 } });
      let playerObj: ExtractedPlayer = {
        gamertag: `${name}#${tag}`,
        name: name,
        position: 'Duelista',
        rankTitle: 'Unranked',
      };

      if (accRes.ok) {
        const accData = await accRes.json();
        if (accData?.data) {
          playerObj = {
            gamertag: `${accData.data.name}#${accData.data.tag}`,
            name: accData.data.name,
            avatarUrl: accData.data.card?.small || accData.data.card?.wide,
            rankTitle: `Nivel ${accData.data.account_level || 1}`,
            stats: {
              accountLevel: accData.data.account_level || 1,
            },
          };
        }
      }

      const teamName = `${name.toUpperCase()} SQUAD`;
      const cleanTag = name.substring(0, 3).toUpperCase();

      return {
        success: true,
        teams: [
          {
            teamName,
            tag: cleanTag,
            gameSlug: 'valorant',
            platform: 'PC',
            description: `Escuadra Táctica Valorant liderada por ${name}#${tag}`,
            division: 'Premier Division',
            roster: [playerObj],
            sourceApi: 'Riot Games / HenrikDev Valorant API',
          },
        ],
        players: [playerObj],
        sourceApi: 'Riot Games / HenrikDev Valorant API',
        query,
      };
    }

    // Búsqueda por Nombre de Escuadra Táctica
    const cleanTag = trimmed.substring(0, 3).toUpperCase();
    return {
      success: true,
      teams: [
        {
          teamName: trimmed.toUpperCase(),
          tag: cleanTag,
          gameSlug: 'valorant',
          platform: 'PC',
          description: `Escuadra Táctica VALORANT 5v5 (${trimmed})`,
          division: 'Premier Division',
          record: { wins: 0, losses: 0 },
          roster: [],
          sourceApi: 'Búsqueda Táctica VALORANT',
        },
      ],
      sourceApi: 'Valorant API Service',
      query,
    };
  } catch (err: any) {
    console.error('Error en búsqueda de VALORANT:', err);
    return {
      success: false,
      teams: [],
      message: `Error al consultar la API de VALORANT: ${err.message || 'Error de conexión'}`,
      sourceApi: 'VALORANT API',
      query,
    };
  }
}
