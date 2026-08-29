const fs = require('fs');

let code = fs.readFileSync('src/app/api/teams/route.ts', 'utf8');

const getReplace = `
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameSlug = searchParams.get('gameSlug');
  const { page, limit } = parsePaginationParams(searchParams);

  try {
    const where: any = {};
    if (gameSlug && !['ALL', 'all', 'TODOS', 'todas'].includes(gameSlug)) {
      where.gameSlug = gameSlug;
    }

    const { dbProvider } = await import('@/lib/db/provider');
    const offset = (page - 1) * limit;
    
    // Using dbProvider directly
    const teamsData = await dbProvider.teams.findAll({ where, limit, offset, orderBy: 'created_at', orderDirection: 'DESC' });
    // Total count workaround (fallback since we don't have a count method)
    const total = teamsData.length;

    const teams = teamsData.map(t => ({
      id: t.id,
      name: t.name,
      tag: t.tag,
      game_slug: t.gameSlug,
      platform: t.platform,
      color: t.color,
      logo_text: t.logoText,
      description: t.description,
      status: t.status,
      logo_url: t.logoUrl,
      banner_url: t.bannerUrl,
      captain_id: t.captainId,
      captain_name: t.captainName,
      created_at: t.createdAt,
    }));
    
    const meta = buildPaginationMeta(page, limit, total);
    return apiSuccess({ teams }, undefined, meta);
  } catch (err) {
    console.error(err);
    return apiSuccess({ teams: [] });
  }
}
`;

code = code.replace(/export async function GET.*?return apiSuccess\(\{ teams: \[\] \}\);\r?\n  \}\r?\n\}/s, getReplace.trim());

fs.writeFileSync('src/app/api/teams/route.ts', code);
console.log('Patched GET in api/teams/route.ts');
