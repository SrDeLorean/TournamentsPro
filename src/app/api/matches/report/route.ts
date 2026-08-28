import { NextResponse } from 'next/server';
import { queryDB, executeCommand } from '@/lib/db';
import { getServerUserSession } from '@/lib/auth-server';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const session = await getServerUserSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { matchId, homeScore, awayScore, mvpName, dynamicStats, participantsStats, gameSlug } = data;

    if (!matchId) return NextResponse.json({ error: 'Match ID requerido' }, { status: 400 });

    const matches = await queryDB('SELECT * FROM matches WHERE id = ?', [matchId]);
    if (!matches.length) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
    const match = matches[0] as any;

    await executeCommand(`
      UPDATE matches 
      SET reported_score_home = ?, reported_score_away = ?, status = 'POR_REVISAR'
      WHERE id = ?
    `, [homeScore, awayScore, matchId]);

    // Insertar TODAS las stats de los participantes si provienen de Riot API
    if (participantsStats && Array.isArray(participantsStats)) {
      for (const p of participantsStats) {
        if (!p.riotId) continue;
        const cleanGamertag = p.riotId.split('#')[0]; // Simplify lookup
        
        // Find user by gamertag or create a temporary association
        const users = await queryDB('SELECT id FROM users WHERE gamertag = ? OR name = ? LIMIT 1', [cleanGamertag, cleanGamertag]);
        const playerId = users.length > 0 ? (users[0] as any).id : `temp-${cleanGamertag}`;
        
        const statsId = `st-${randomUUID().substring(0, 8)}`;
        await executeCommand(`
          INSERT INTO match_player_stats (id, match_id, player_id, game_slug, stats_json)
          VALUES (?, ?, ?, ?, ?)
        `, [statsId, matchId, playerId, gameSlug || match.game_slug, JSON.stringify(p.stats)]);
      }
    } 
    // Fallback: Si solo reportaron el MVP manual
    else if (mvpName && dynamicStats) {
      const cleanGamertag = mvpName.replace('@', '').trim();
      const users = await queryDB('SELECT id FROM users WHERE gamertag = ? OR name = ? LIMIT 1', [cleanGamertag, cleanGamertag]);
      const mvpId = users.length > 0 ? (users[0] as any).id : `temp-${cleanGamertag}`;

      const statsId = `st-${randomUUID().substring(0, 8)}`;
      await executeCommand(`
        INSERT INTO match_player_stats (id, match_id, player_id, game_slug, stats_json)
        VALUES (?, ?, ?, ?, ?)
      `, [statsId, matchId, mvpId, gameSlug || match.game_slug, JSON.stringify(dynamicStats)]);
    }

    return NextResponse.json({ success: true, message: 'Reporte enviado a revisión' });
  } catch (error: any) {
    console.error('Match Report API error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
