import { NextResponse } from 'next/server';
import { queryDB } from '@/lib/db/provider';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import { canManageCompetition } from '@/lib/authorization';
import { writeSecurityAudit } from '@/lib/security';
import { fixtureRequestBodySchema } from '@/lib/api-schemas';

interface FixtureTeam {
  id: string;
  name: string;
  tag: string;
}

export async function POST(request: Request) {
  try {
    const actor = await requireRequestActor(request, ['Administrador', 'Organizador']);
    const parsedBody = fixtureRequestBodySchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Configuración de fixture inválida' }, { status: 400 });
    }
    const body = parsedBody.data;
    const { tournamentId, format, startDate, matchdayTime } = body;

    if (!tournamentId) {
      return NextResponse.json({ error: 'Falta ID del torneo' }, { status: 400 });
    }

    let resources = await queryDB<{ organization_id: string | null; organizer_id: string | null }>(
      'SELECT organization_id, organizer_id FROM competitions WHERE id = ? LIMIT 1',
      [tournamentId],
    );
    const resource = resources[0];
    if (!resource) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
    }
    if (!canManageCompetition(actor, {
      organizationId: resource.organization_id,
      organizerId: resource.organizer_id,
    })) {
      return NextResponse.json({ error: 'No tienes permisos para generar este fixture' }, { status: 403 });
    }

    // 1. Fetch Enrolled Teams with real names and tags
    const enrolledTeams = await queryDB<FixtureTeam>(
      `SELECT t.id, COALESCE(t.name, t.team_name, 'Equipo BD') as name, COALESCE(t.tag, UPPER(LEFT(COALESCE(t.name, 'EQU'), 3))) as tag
       FROM tournament_teams tt
       JOIN teams t ON (tt.team_id = t.id OR tt.teamId = t.id)
       WHERE (tt.tournament_id = ? OR tt.tournamentId = ?)`,
      [tournamentId, tournamentId]
    );

    if (enrolledTeams.length < 2) {
      return NextResponse.json({ error: 'Se necesitan al menos 2 equipos inscritos para generar fixture' }, { status: 400 });
    }

    const teamMap = new Map<string, FixtureTeam>();
    enrolledTeams.forEach((team) => teamMap.set(team.id, team));

    // 2. Clear existing matches for this tournament/competition
    await queryDB('DELETE FROM matches WHERE competition_id = ?', [tournamentId]);

    const teamIds = enrolledTeams.map((team) => team.id);
    const fmt = (format || 'LIGA').toUpperCase();
    
    // Update the actual competition format in the database so it matches the generated fixture
    await queryDB('UPDATE competitions SET format = ? WHERE id = ?', [fmt, tournamentId]);

    const baseDate = startDate ? new Date(startDate) : new Date();
    const [hours, minutes] = (matchdayTime || '20:00').split(':');

    const getScheduledStr = (daysOffset: number, hh?: number, mm?: number) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + daysOffset);
      d.setHours(hh !== undefined ? hh : Number(hours) || 20, mm !== undefined ? mm : Number(minutes) || 0, 0, 0);
      return d.toISOString().slice(0, 19).replace('T', ' ');
    };

    // Helper to insert match with full sync fields
    const insertMatch = async (m: {
      id: string;
      round: number;
      matchday: number;
      roundName: string;
      groupName: string;
      homeId: string;
      awayId: string;
      scheduledAt: string;
      scheduledTime: string;
    }) => {
      const homeTeam = teamMap.get(m.homeId) || { name: 'Equipo Local', tag: 'LOC' };
      const awayTeam = teamMap.get(m.awayId) || { name: 'Equipo Visitante', tag: 'VIS' };

      await queryDB(
        `INSERT INTO matches (
          id, tournament_id, competition_id, round, matchday, round_name, group_name,
          team_home_id, team_away_id, home_team_id, away_team_id,
          home_team_name, home_team_tag, away_team_name, away_team_tag,
          scheduled_at, scheduled_time, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROGRAMADO')`,
        [
          m.id, tournamentId, tournamentId, m.round, m.matchday, m.roundName, m.groupName,
          m.homeId, m.awayId, m.homeId, m.awayId,
          homeTeam.name, homeTeam.tag, awayTeam.name, awayTeam.tag,
          m.scheduledAt, m.scheduledTime
        ]
      );
    };

    if (fmt.includes('PLAYOFF') || fmt.includes('ELIMINATORIA')) {
      // 🏆 FORMATO PLAYOFF (Semifinales + Gran Final + Partido por el 3er Lugar / Segunda Final)
      const t1 = teamIds[0] || 'team-1';
      const t2 = teamIds[1] || 'team-2';
      const t3 = teamIds[2] || 'team-3';
      const t4 = teamIds[3] || 'team-4';

      const dateSF = getScheduledStr(0, 20, 0);
      const dateFinals = getScheduledStr(7, 21, 0);

      // Semifinal 1
      await insertMatch({
        id: `match-${tournamentId}-sf1`,
        round: 1, matchday: 1, roundName: 'SEMIFINAL 1', groupName: 'PLAYOFF',
        homeId: t1, awayId: t4, scheduledAt: dateSF, scheduledTime: '20:00'
      });

      // Semifinal 2
      await insertMatch({
        id: `match-${tournamentId}-sf2`,
        round: 1, matchday: 1, roundName: 'SEMIFINAL 2', groupName: 'PLAYOFF',
        homeId: t2, awayId: t3, scheduledAt: dateSF, scheduledTime: '20:30'
      });

      // 🥉 Segunda Final (Tercer Lugar)
      await insertMatch({
        id: `match-${tournamentId}-3rd`,
        round: 2, matchday: 2, roundName: 'TERCER LUGAR 🥉', groupName: 'PLAYOFF',
        homeId: t3, awayId: t4, scheduledAt: dateFinals, scheduledTime: '21:00'
      });

      // 🏆 Gran Final
      await insertMatch({
        id: `match-${tournamentId}-final`,
        round: 2, matchday: 2, roundName: 'GRAN FINAL 🏆', groupName: 'PLAYOFF',
        homeId: t1, awayId: t2, scheduledAt: dateFinals, scheduledTime: '22:00'
      });

    } else if (fmt.includes('HIBRID') || fmt.includes('GRUPO')) {
      // ⚡ FORMATO HÍBRIDO (Fase de Grupos + Playoff con Segunda Final)
      const mid = Math.ceil(teamIds.length / 2);
      const groupA = teamIds.slice(0, mid);
      const groupB = teamIds.slice(mid);

      // Partidos Grupo A
      let countA = 0;
      for (let i = 0; i < groupA.length; i++) {
        for (let j = i + 1; j < groupA.length; j++) {
          countA++;
          const dateGroup = getScheduledStr(i, 20, 0);
          await insertMatch({
            id: `match-${tournamentId}-ga-${i}-${j}`,
            round: countA, matchday: countA, roundName: 'Fase de Grupos', groupName: 'GRUPO A',
            homeId: groupA[i], awayId: groupA[j], scheduledAt: dateGroup, scheduledTime: '20:00'
          });
        }
      }

      // Partidos Grupo B
      let countB = 0;
      for (let i = 0; i < groupB.length; i++) {
        for (let j = i + 1; j < groupB.length; j++) {
          countB++;
          const dateGroup = getScheduledStr(i, 20, 30);
          await insertMatch({
            id: `match-${tournamentId}-gb-${i}-${j}`,
            round: countB, matchday: countB, roundName: 'Fase de Grupos', groupName: 'GRUPO B',
            homeId: groupB[i], awayId: groupB[j], scheduledAt: dateGroup, scheduledTime: '20:30'
          });
        }
      }

      // Playoffs del Torneo Híbrido (Semifinales, Gran Final 🏆 y Segunda Final 🥉)
      const dateSF = getScheduledStr(14, 20, 0);
      const dateFinals = getScheduledStr(21, 21, 0);

      await insertMatch({
        id: `match-${tournamentId}-sf1`,
        round: 10, matchday: 10, roundName: 'SEMIFINAL 1', groupName: 'PLAYOFF',
        homeId: groupA[0] || teamIds[0], awayId: groupB[1] || teamIds[1], scheduledAt: dateSF, scheduledTime: '20:00'
      });

      await insertMatch({
        id: `match-${tournamentId}-sf2`,
        round: 10, matchday: 10, roundName: 'SEMIFINAL 2', groupName: 'PLAYOFF',
        homeId: groupB[0] || teamIds[1], awayId: groupA[1] || teamIds[0], scheduledAt: dateSF, scheduledTime: '20:30'
      });

      await insertMatch({
        id: `match-${tournamentId}-3rd`,
        round: 11, matchday: 11, roundName: 'TERCER LUGAR 🥉', groupName: 'PLAYOFF',
        homeId: groupA[1] || teamIds[0], awayId: groupB[1] || teamIds[1], scheduledAt: dateFinals, scheduledTime: '21:00'
      });

      await insertMatch({
        id: `match-${tournamentId}-final`,
        round: 11, matchday: 11, roundName: 'GRAN FINAL 🏆', groupName: 'PLAYOFF',
        homeId: groupA[0] || teamIds[0], awayId: groupB[0] || teamIds[1], scheduledAt: dateFinals, scheduledTime: '22:00'
      });

    } else {
      // ⚽ Round Robin (Liga) Generator Algorithm
      const n = teamIds.length % 2 === 0 ? teamIds.length : teamIds.length + 1;
      const list: Array<string | null> = [...teamIds];
      if (teamIds.length % 2 !== 0) list.push(null);

      const totalRounds = n - 1;

      for (let round = 1; round <= totalRounds; round++) {
        const scheduledAtStr = getScheduledStr((round - 1) * 7);

        for (let i = 0; i < n / 2; i++) {
          const home = list[i];
          const away = list[n - 1 - i];

          if (home && away) {
            await insertMatch({
              id: `match-${tournamentId}-r${round}-${i + 1}`,
              round: round, matchday: round, roundName: `Jornada ${round}`, groupName: 'LIGA',
              homeId: home, awayId: away, scheduledAt: scheduledAtStr, scheduledTime: '20:00'
            });
          }
        }

        list.splice(1, 0, list.pop()!);
      }
    }

    // 3. Update status and format
    try {
      await queryDB('UPDATE competitions SET status = "En_Juego", format = ?, mode_format = ? WHERE id = ?', [fmt, fmt, tournamentId]);
    } catch {}

    await writeSecurityAudit({
      actor,
      request,
      action: 'FIXTURE_GENERATED',
      resourceType: 'competition',
      resourceId: tournamentId,
      organizationId: resource.organization_id,
      metadata: { format: fmt, enrolledTeams: enrolledTeams.length },
    });

    return NextResponse.json({
      success: true,
      message: 'Fixture generado exitosamente con sincronización completa de tablas, grupos y playoffs',
    });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Error generando fixture' }, { status: 500 });
  }
}

