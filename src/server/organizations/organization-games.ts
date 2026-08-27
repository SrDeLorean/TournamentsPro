import type { DatabaseExecutor } from '@/lib/db';

export async function replaceOrganizationGames(
  executor: DatabaseExecutor,
  organizationId: string,
  gameSlugs: readonly string[],
) {
  const uniqueGameSlugs = [...new Set(gameSlugs)];
  await executor.executeCommand(
    'DELETE FROM organization_games WHERE organization_id = ?',
    [organizationId],
  );

  for (const gameSlug of uniqueGameSlugs) {
    await executor.executeCommand(
      'INSERT INTO organization_games (organization_id, game_slug) VALUES (?, ?)',
      [organizationId, gameSlug],
    );
  }
}

export async function findOrganizationGames(executor: DatabaseExecutor, organizationId: string) {
  const rows = await executor.queryRows<{ game_slug: string }>(
    'SELECT game_slug FROM organization_games WHERE organization_id = ? ORDER BY game_slug',
    [organizationId],
  );
  return rows.map((row) => row.game_slug);
}
