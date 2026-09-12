import { ExtractedTeam, ExtractedPlayer, GameApiSearchResult } from './types';

interface EaClub {
  clubId?: string | number;
  id?: string | number;
  name?: string;
  clubName?: string;
  currentDivision?: string | number;
  rank?: string | number;
  wins?: number;
  overallWins?: number;
  losses?: number;
  overallLosses?: number;
  ties?: number;
  overallTies?: number;
}

interface EaMember {
  name?: string;
  proName?: string;
  gamertag?: string;
  favoritePosition?: string;
  position?: string;
  rating?: number;
  goals?: number;
  assists?: number;
  gamesPlayed?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Conector de la API oficial de EA SPORTS FC Pro Clubs
 */
export async function searchEaFcProClub(query: string, platform = 'common-gen5'): Promise<GameApiSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { success: false, teams: [], message: 'Ingresa el nombre o ID del club EA FC', sourceApi: 'EA Pro Clubs API', query };
  }

  try {
    // 1. Intentar buscar club por nombre en la API pública de EA Pro Clubs
    const searchUrl = `https://proclubs.ea.com/api/fc/clubs/search?platform=${platform}&clubName=${encodeURIComponent(trimmed)}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Caché de 5 minutos
    });

    let rawClubs: EaClub[] = [];
    if (searchRes.ok) {
      const data: unknown = await searchRes.json();
      const candidates = Array.isArray(data) ? data : isRecord(data) ? Object.values(data) : [];
      rawClubs = candidates.filter(isRecord) as EaClub[];
    }

    // Si la búsqueda directa devuelve clubes
    if (rawClubs.length > 0) {
      const extractedTeams: ExtractedTeam[] = await Promise.all(
        rawClubs.slice(0, 5).map(async (club) => {
          const clubId = club.clubId || club.id;
          const clubName = club.name || club.clubName || trimmed;
          const tag = clubName.substring(0, 3).toUpperCase();

          // Intentar obtener los jugadores del club
          let roster: ExtractedPlayer[] = [];
          try {
            const rosterUrl = `https://proclubs.ea.com/api/fc/members/career/stats?platform=${platform}&clubId=${clubId}`;
            const rosterRes = await fetch(rosterUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
            });
            if (rosterRes.ok) {
              const rData: unknown = await rosterRes.json();
              const members = isRecord(rData) && rData.members ? rData.members : rData;
              const candidates = Array.isArray(members) ? members : isRecord(members) ? Object.values(members) : [];
              roster = (candidates.filter(isRecord) as EaMember[]).map((m) => ({
                gamertag: m.name || m.proName || m.gamertag || 'Jugador EA FC',
                position: m.favoritePosition || m.position || 'MC',
                rating: m.rating ? Math.round(Number(m.rating)) : 85,
                stats: {
                  goals: m.goals || 0,
                  assists: m.assists || 0,
                  gamesPlayed: m.gamesPlayed || 0,
                },
              }));
            }
          } catch (e) {
            console.warn('No se pudo cargar el roster detallado de EA FC:', e);
          }

          return {
            teamName: clubName,
            tag: tag,
            gameSlug: 'eafc26',
            platform: platform.includes('gen4') ? 'PS4' : 'CROSSPLAY',
            description: `Club Pro EA SPORTS FC 26 registrado en la plataforma ${platform.toUpperCase()}`,
            division: club.currentDivision ? `División ${club.currentDivision}` : 'División 1',
            rank: club.rank ? `Rango #${club.rank}` : 'Top Pro Clubs',
            record: {
              wins: Number(club.wins || club.overallWins || 0),
              losses: Number(club.losses || club.overallLosses || 0),
              draws: Number(club.ties || club.overallTies || 0),
            },
            roster,
            externalId: String(clubId),
            sourceApi: 'EA Sports Pro Clubs API',
          };
        })
      );

      return {
        success: true,
        teams: extractedTeams,
        sourceApi: 'EA Sports Pro Clubs API',
        query,
      };
    }

    // Si la API de EA no devuelve resultados exactos o está restringida, crear sugerencia formateada
    const cleanTag = trimmed.substring(0, 3).toUpperCase();
    return {
      success: true,
      teams: [
        {
          teamName: trimmed.toUpperCase(),
          tag: cleanTag,
          gameSlug: 'eafc26',
          platform: 'CROSSPLAY',
          description: `Club eSports EA FC 26 (${trimmed}) preparado para torneos 11v11 / 2v2`,
          division: 'División Competitiva',
          record: { wins: 0, losses: 0, draws: 0 },
          roster: [],
          sourceApi: 'Búsqueda Estándar EA FC 26',
        },
      ],
      message: `Resultados generados para "${trimmed}". Si los datos son correctos, procede a confirmar.`,
      sourceApi: 'EA Sports Pro Clubs API',
      query,
    };
  } catch (err: unknown) {
    console.error('Error en búsqueda de EA FC Pro Club:', err);
    return {
      success: false,
      teams: [],
      message: `No se pudo conectar a la API de EA FC: ${err instanceof Error ? err.message : 'Error de conexión'}`,
      sourceApi: 'EA Sports Pro Clubs API',
      query,
    };
  }
}
