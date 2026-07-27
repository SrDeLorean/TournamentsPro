import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';

// GET /api/organizer/fixture?tournamentId=... - List matches, teams, and standings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json({ error: 'ID de torneo requerido' }, { status: 400 });
    }

    const matches = await queryDB<any>(
      `SELECT m.*, 
              th.name as home_team_name, th.tag as home_team_tag, th.color as home_team_color, th.logo_url as home_team_logo,
              ta.name as away_team_name, ta.tag as away_team_tag, ta.color as away_team_color, ta.logo_url as away_team_logo
       FROM matches m
       LEFT JOIN teams th ON m.team_home_id = th.id
       LEFT JOIN teams ta ON m.team_away_id = ta.id
       WHERE m.tournament_id = ?
       ORDER BY m.matchday ASC, m.scheduled_at ASC`,
      [tournamentId]
    );

    const enrolledTeams = await queryDB<any>(
      `SELECT t.* FROM tournament_teams tt
       JOIN teams t ON tt.team_id = t.id
       WHERE tt.tournament_id = ? AND t.is_banned = 0`,
      [tournamentId]
    );

    return NextResponse.json({ success: true, matches, enrolledTeams });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error consultando fixture' }, { status: 500 });
  }
}

// POST /api/organizer/fixture - Generate automatic fixture & schedule
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tournamentId, format = 'LIGA', matchdayTime = '20:00', startDate } = body;

    if (!tournamentId) {
      return NextResponse.json({ error: 'ID de torneo requerido' }, { status: 400 });
    }

    // Get enrolled teams
    const enrolledTeams = await queryDB<any>(
      `SELECT t.id, t.name FROM tournament_teams tt JOIN teams t ON tt.team_id = t.id WHERE tt.tournament_id = ? AND t.is_banned = 0`,
      [tournamentId]
    );

    if (!enrolledTeams || enrolledTeams.length < 2) {
      return NextResponse.json({ error: 'Se requieren al menos 2 equipos inscritos para generar el fixture' }, { status: 400 });
    }

    // Clear previous matches for this tournament
    await queryDB('DELETE FROM matches WHERE tournament_id = ?', [tournamentId]);

    const teamIds = enrolledTeams.map((t) => t.id);

    // Round Robin (Liga) Generator Algorithm
    if (format === 'LIGA') {
      const n = teamIds.length % 2 === 0 ? teamIds.length : teamIds.length + 1;
      const list = [...teamIds];
      if (teamIds.length % 2 !== 0) list.push(null as any); // Bye

      const totalRounds = n - 1;
      const baseDate = startDate ? new Date(startDate) : new Date();

      for (let round = 1; round <= totalRounds; round++) {
        // Scheduled Date per Matchday (All matches on same matchday play simultaneously at matchdayTime)
        const scheduledDate = new Date(baseDate);
        scheduledDate.setDate(scheduledDate.getDate() + (round - 1) * 7); // Weekly matchday
        const [hours, minutes] = matchdayTime.split(':');
        scheduledDate.setHours(Number(hours) || 20, Number(minutes) || 0, 0, 0);

        const scheduledAtStr = scheduledDate.toISOString().slice(0, 19).replace('T', ' ');

        for (let i = 0; i < n / 2; i++) {
          const home = list[i];
          const away = list[n - 1 - i];

          if (home && away) {
            const matchId = `match-${tournamentId}-r${round}-${i + 1}`;
            await queryDB(
              `INSERT INTO matches (id, tournament_id, round, matchday, team_home_id, team_away_id, scheduled_at, status, group_name)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', 'Liga')`,
              [matchId, tournamentId, round, round, home, away, scheduledAtStr]
            );
          }
        }

        // Rotate list for Round Robin
        list.splice(1, 0, list.pop()!);
      }
    }

    await queryDB('UPDATE tournaments SET status = "En_Juego" WHERE id = ?', [tournamentId]);

    return NextResponse.json({ success: true, message: 'Fixture y calendario generado exitosamente con partidos simultáneos' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error generando fixture' }, { status: 500 });
  }
}
