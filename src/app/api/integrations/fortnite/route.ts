import { NextResponse } from 'next/server';
import { getServerUserSession } from '@/lib/auth-server';

interface FortniteStatPayload {
  eliminations: number;
  damage_dealt: number;
  placement: number;
  revives: number;
  accuracy: number;
}

interface FortniteParticipant {
  gamertag: string;
  team: 'home' | 'away';
  isMvp?: boolean;
  stats: FortniteStatPayload;
}

export async function GET(request: Request) {
  try {
    const session = await getServerUserSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || searchParams.get('gamertag') || 'PlayerOne';
    const accountType = searchParams.get('accountType') || 'epic';
    const mode = searchParams.get('mode') || 'escuadrones'; // escuadrones, trios, duos, solo
    const homeTeam = searchParams.get('homeTeam') || 'Escuadra Alpha';
    const awayTeam = searchParams.get('awayTeam') || 'Escuadra Beta';

    const FORTNITE_API_KEY = process.env.FORTNITE_API_KEY;

    // Helper to generate simulated tournament match data matching squad rules
    const getMockFortniteMatch = (squadMode: string) => {
      let squadSize = 4;
      if (squadMode === 'solo' || squadMode === '1v1') squadSize = 1;
      else if (squadMode === 'duos' || squadMode === '2v2') squadSize = 2;
      else if (squadMode === 'trios' || squadMode === '3v3') squadSize = 3;

      const homeParticipants: FortniteParticipant[] = [];
      const awayParticipants: FortniteParticipant[] = [];

      let homeTotalKills = 0;
      let awayTotalKills = 0;

      // Generate Home Team
      for (let i = 0; i < squadSize; i++) {
        const kills = Math.floor(Math.random() * 8) + (i === 0 ? 4 : 1);
        const damage = kills * 180 + Math.floor(Math.random() * 300) + 120;
        homeTotalKills += kills;
        homeParticipants.push({
          gamertag: i === 0 ? username : `${homeTeam.replace(/\s+/g, '')}_FN${i + 1}`,
          team: 'home',
          isMvp: i === 0,
          stats: {
            eliminations: kills,
            damage_dealt: damage,
            placement: 1,
            revives: Math.floor(Math.random() * 3),
            accuracy: Math.floor(Math.random() * 25) + 20,
          },
        });
      }

      // Generate Away Team
      for (let i = 0; i < squadSize; i++) {
        const kills = Math.max(0, Math.floor(Math.random() * 6));
        const damage = kills * 160 + Math.floor(Math.random() * 200) + 80;
        awayTotalKills += kills;
        awayParticipants.push({
          gamertag: `${awayTeam.replace(/\s+/g, '')}_FN${i + 1}`,
          team: 'away',
          isMvp: false,
          stats: {
            eliminations: kills,
            damage_dealt: damage,
            placement: 2,
            revives: Math.floor(Math.random() * 2),
            accuracy: Math.floor(Math.random() * 20) + 18,
          },
        });
      }

      return {
        participants: [...homeParticipants, ...awayParticipants],
        matchScore: {
          team1: homeTotalKills,
          team2: awayTotalKills,
        },
        mode: squadMode,
        squadSize,
        placement: {
          home: 1,
          away: 2,
        },
      };
    };

    // If Fortnite API Key is available, attempt real live stats lookup
    if (FORTNITE_API_KEY && FORTNITE_API_KEY !== 'tu_fortnite_api_key') {
      try {
        const apiUrl = `https://fortnite-api.com/v2/stats/br/v2?name=${encodeURIComponent(username)}&accountType=${encodeURIComponent(accountType)}`;
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: FORTNITE_API_KEY,
          },
        });

        if (response.ok) {
          const apiData = await response.json();
          const stats = apiData.data?.stats?.all;
          const mockData = getMockFortniteMatch(mode);

          if (stats && mockData.participants.length > 0) {
            const modeStats = stats[mode === 'solo' ? 'solo' : mode === 'duos' ? 'duo' : mode === 'trios' ? 'trio' : 'squad'] || stats.overall;
            if (modeStats) {
              mockData.participants[0].stats = {
                eliminations: modeStats.killsPerMatch ? Math.round(modeStats.killsPerMatch) : 4,
                damage_dealt: modeStats.scorePerMatch ? Math.round(modeStats.scorePerMatch * 1.5) : 850,
                placement: 1,
                revives: Math.floor(Math.random() * 3),
                accuracy: Math.round(modeStats.winRate || 24),
              };
            }
          }

          return NextResponse.json({
            success: true,
            source: 'fortnite_api_live',
            account: apiData.data?.account,
            ...mockData,
          });
        }
      } catch (externalErr) {
        console.warn('Fortnite external API call failed, using mock fallback:', externalErr);
      }
    }

    // Default mock response for dev or when no key is set
    const mockData = getMockFortniteMatch(mode);
    return NextResponse.json({
      success: true,
      source: 'fortnite_simulated',
      ...mockData,
    });
  } catch (error: any) {
    console.error('Fortnite API Integration Error:', error);
    return NextResponse.json({ error: error.message || 'Error al conectar con la API de Fortnite' }, { status: 500 });
  }
}
