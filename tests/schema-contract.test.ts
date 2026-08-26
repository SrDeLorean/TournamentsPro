import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const baseline = readFileSync(resolve(process.cwd(), 'database/baseline.sql'), 'utf8');
const compatibilityMigration = readFileSync(
  resolve(process.cwd(), 'database/migrations/0005_profile_schema_and_canonical_competitions.sql'),
  'utf8',
);

describe('runtime database contract', () => {
  it.each([
    ['users', 'foto'],
    ['users', 'game_profiles'],
    ['organizations', 'status'],
    ['organizations', 'redes_sociales'],
    ['teams', 'encargados_json'],
    ['teams', 'redes_sociales'],
  ])('keeps %s.%s in the fresh-install baseline', (_table, column) => {
    expect(baseline).toContain(`\`${column}\``);
  });

  it('normalizes legacy match identifiers toward competition_id', () => {
    expect(compatibilityMigration).toMatch(/SET\s+`competition_id`\s*=\s*`tournament_id`/i);
    expect(compatibilityMigration).toMatch(/SET\s+`tournament_id`\s*=\s*`competition_id`/i);
  });

  it('prevents responsible-user deletion from cascading into domain records', () => {
    expect(baseline).toMatch(/fk_org_owner[\s\S]*?ON DELETE RESTRICT/i);
    expect(baseline).toMatch(/fk_teams_captain[\s\S]*?ON DELETE RESTRICT/i);
    expect(baseline).toMatch(/fk_comp_organizer[\s\S]*?ON DELETE RESTRICT/i);
  });
});
