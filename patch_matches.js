const fs = require('fs');
let code = fs.readFileSync('src/app/api/matches/route.ts', 'utf8');
const getReplace = `
  try {
    const limit = Number(searchParams.get('limit')) || 50;
    const { dbProvider } = await import('@/lib/db/provider');
    const matchesData = await dbProvider.matches.findAll({ limit, orderBy: 'created_at', orderDirection: 'DESC' });
    const matches = matchesData.map(m => ({
      id: m.id,
      competition_id: m.competitionId,
      home_team_id: m.homeTeamId,
      away_team_id: m.awayTeamId,
      home_team_name: m.homeTeamName,
      away_team_name: m.awayTeamName,
      status: m.status,
      score_home: m.scoreHome,
      score_away: m.scoreAway,
      scheduled_time: m.scheduledTime
    }));
    const total = matches.length;
    const meta = buildPaginationMeta(1, limit, total);
    return apiSuccess({ matches, total }, undefined, meta);
  } catch (error: unknown) {
`;
code = code.replace(/try\s*\{\s*const limit = Number\(searchParams\.get\('limit'\)\) \|\| 50;[\s\S]*?return apiSuccess\(\{ matches, total \}, undefined, meta\);\s*\} catch \(error: unknown\) \{/, getReplace.trim() + ' {');
fs.writeFileSync('src/app/api/matches/route.ts', code);
console.log('Patched matches');
