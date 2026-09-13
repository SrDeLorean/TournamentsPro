import { NextResponse } from 'next/server';
import { dbProvider } from '@/lib/db/provider';
import { authorizationErrorResponse, requireRequestActor } from '@/lib/auth-server';
import { canManageCompetition } from '@/lib/authorization';
import { writeSecurityAudit } from '@/lib/security';
import { fixtureRequestBodySchema } from '@/lib/api-schemas';

import { generatePlayoffBracket } from '@/lib/matchmaking-bracket';

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

    const resource = await dbProvider.competitions.findById(tournamentId);
    if (!resource) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
    }
    if (!canManageCompetition(actor, {
      organizationId: resource.organizationId,
      organizerId: resource.organizerId,
    })) {
      return NextResponse.json({ error: 'No tienes permisos para generar este fixture' }, { status: 403 });
    }

    // 1. Fetch Enrolled Teams with real names and tags
    const enrolledTeamsData = await dbProvider.competitions.getEnrolledTeams(tournamentId);
    const enrolledTeams: FixtureTeam[] = enrolledTeamsData.map(t => ({
      id: t.team_id || t.teamId || t.id || '',
      name: t.team_name || t.teamName || 'Equipo BD',
      tag: t.team_tag || t.teamTag || (t.team_name || t.teamName || 'EQU').substring(0, 3).toUpperCase()
    }));

    if (enrolledTeams.length < 2) {
      return NextResponse.json({ error: 'Se necesitan al menos 2 equipos inscritos para generar fixture' }, { status: 400 });
    }

    const teamMap = new Map<string, FixtureTeam>();
    enrolledTeams.forEach((team) => teamMap.set(team.id, team));

    // 2. Clear existing matches for this tournament/competition
    const existingMatches = await dbProvider.matches.findByCompetition(tournamentId);
    for (const match of existingMatches) {
      await dbProvider.matches.delete(match.id);
    }

    const teamIds = enrolledTeams.map((team) => team.id);
    const fmt = (format || 'LIGA').toUpperCase();
    
    // Update the actual competition format in the database so it matches the generated fixture
    await dbProvider.competitions.update(tournamentId, { format: fmt });

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
      homeId: string | null;
      awayId: string | null;
      homeName?: string;
      awayName?: string;
      homeTag?: string;
      awayTag?: string;
      nextMatchId?: string | null;
      nextMatchSlot?: string | null;
      scheduledAt: string;
      scheduledTime: string;
      status?: string;
      winnerTeamId?: string | null;
    }) => {
      const homeTeam = m.homeId ? teamMap.get(m.homeId) : null;
      const awayTeam = m.awayId ? teamMap.get(m.awayId) : null;
      const homeName = m.homeName || homeTeam?.name || (m.homeId ? 'Equipo Local' : 'Por Definir');
      const awayName = m.awayName || awayTeam?.name || (m.awayId ? 'Equipo Visitante' : 'Por Definir');
      const homeTag = m.homeTag || homeTeam?.tag || (m.homeId ? homeName.substring(0, 3).toUpperCase() : 'TBD');
      const awayTag = m.awayTag || awayTeam?.tag || (m.awayId ? awayName.substring(0, 3).toUpperCase() : 'TBD');

      await dbProvider.matches.create({
        id: m.id,
        tournamentId: tournamentId,
        competitionId: tournamentId,
        round: m.round,
        matchday: m.matchday,
        roundName: m.roundName,
        groupName: m.groupName,
        teamHomeId: m.homeId || null,
        homeTeamId: m.homeId || null,
        teamAwayId: m.awayId || null,
        awayTeamId: m.awayId || null,
        homeTeamName: homeName,
        homeTeamTag: homeTag,
        awayTeamName: awayName,
        awayTeamTag: awayTag,
        nextMatchId: m.nextMatchId || null,
        nextMatchSlot: m.nextMatchSlot || null,
        scheduledAt: m.scheduledAt,
        scheduledTime: m.scheduledTime,
        status: m.status || 'PROGRAMADO',
        winnerTeamId: m.winnerTeamId || null,
      });
    };

    if (fmt.includes('PLAYOFF') || fmt.includes('ELIMINATORIA')) {
      // 🏆 FORMATO PLAYOFF (Dinámico con emparejamiento por cabezas de serie y auto-avance)
      const matchMode = (body.matchMode || 'PartidoUnico') as 'PartidoUnico' | 'IdaVuelta' | 'MejorDe3';
      const playoffNodes = generatePlayoffBracket(tournamentId, enrolledTeams, matchMode);

      // Insertamos en orden inverso (.reverse()) para satisfacer la clave foránea fk_matches_next
      for (const node of playoffNodes.reverse()) {
        let matchdayNumber = node.roundOrder;
        let dayOffset = (node.roundOrder - 1) * 7;
        let timeStr = `${hours || '20'}:${minutes || '00'}`;

        if (matchMode === 'IdaVuelta') {
          matchdayNumber = (node.roundOrder - 1) * 2 + (node.legType === 'VUELTA' ? 2 : 1);
          dayOffset = (matchdayNumber - 1) * 4;
        } else if (matchMode === 'MejorDe3') {
          const jNum = /-j([123])$/i.exec(node.id)?.[1] || '1';
          matchdayNumber = (node.roundOrder - 1) * 3 + Number(jNum);
          dayOffset = (node.roundOrder - 1) * 7;
          timeStr = jNum === '1' ? '20:00' : jNum === '2' ? '20:45' : '21:30';
        }

        const scheduledAt = getScheduledStr(dayOffset);

        await insertMatch({
          id: node.id,
          round: matchdayNumber,
          matchday: matchdayNumber,
          roundName: node.roundName,
          groupName: 'PLAYOFF',
          homeId: node.homeTeamId,
          awayId: node.awayTeamId,
          homeName: node.homeTeamName,
          awayName: node.awayTeamName,
          nextMatchId: node.nextMatchId,
          nextMatchSlot: node.nextMatchSlot,
          scheduledAt,
          scheduledTime: timeStr,
          status: node.status === 'TERMINADO' ? 'TERMINADO' : 'PROGRAMADO',
          winnerTeamId: node.winnerTeamId || null,
        });
      }

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

      // Playoffs del Torneo Híbrido
      const qPerGroup = Number((body as any).qualifiersPerGroup || (body as any).qualifiers_per_group || resource.qualifiersPerGroup || 2);

      if (qPerGroup === 1) {
        // Final Directa entre el 1° del Grupo A y el 1° del Grupo B
        const dateFinal = getScheduledStr(14, 21, 0);
        await insertMatch({
          id: `match-${tournamentId}-final`,
          round: 10, matchday: 10, roundName: 'GRAN FINAL 🏆', groupName: 'PLAYOFF',
          homeId: groupA[0] || teamIds[0], awayId: groupB[0] || teamIds[1],
          homeName: '1° de Grupo A', awayName: '1° de Grupo B',
          scheduledAt: dateFinal, scheduledTime: '21:00'
        });
      } else {
        // Semifinales, Gran Final 🏆 y Tercer Lugar 🥉
        const dateSF = getScheduledStr(14, 20, 0);
        const dateFinals = getScheduledStr(21, 21, 0);

        await insertMatch({
          id: `match-${tournamentId}-sf1`,
          round: 10, matchday: 10, roundName: 'SEMIFINAL 1', groupName: 'PLAYOFF',
          homeId: groupA[0] || teamIds[0], awayId: groupB[1] || teamIds[1],
          homeName: '1° de Grupo A', awayName: '2° de Grupo B',
          scheduledAt: dateSF, scheduledTime: '20:00'
        });

        await insertMatch({
          id: `match-${tournamentId}-sf2`,
          round: 10, matchday: 10, roundName: 'SEMIFINAL 2', groupName: 'PLAYOFF',
          homeId: groupB[0] || teamIds[1], awayId: groupA[1] || teamIds[0],
          homeName: '1° de Grupo B', awayName: '2° de Grupo A',
          scheduledAt: dateSF, scheduledTime: '20:30'
        });

        await insertMatch({
          id: `match-${tournamentId}-3rd`,
          round: 11, matchday: 11, roundName: 'TERCER LUGAR 🥉', groupName: 'PLAYOFF',
          homeId: groupA[1] || teamIds[0], awayId: groupB[1] || teamIds[1],
          homeName: '2° de Grupo A', awayName: '2° de Grupo B',
          scheduledAt: dateFinals, scheduledTime: '21:00'
        });

        await insertMatch({
          id: `match-${tournamentId}-final`,
          round: 11, matchday: 11, roundName: 'GRAN FINAL 🏆', groupName: 'PLAYOFF',
          homeId: groupA[0] || teamIds[0], awayId: groupB[0] || teamIds[1],
          homeName: '1° de Grupo A', awayName: '1° de Grupo B',
          scheduledAt: dateFinals, scheduledTime: '22:00'
        });
      }

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
      await dbProvider.competitions.update(tournamentId, {
        status: 'En_Juego',
        format: fmt,
        modeFormat: fmt
      });
    } catch {}

    await writeSecurityAudit({
      actor,
      request,
      action: 'FIXTURE_GENERATED',
      resourceType: 'competition',
      resourceId: tournamentId,
      organizationId: resource.organizationId,
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

