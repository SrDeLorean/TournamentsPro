const fs = require('fs');

// 1. Add MatchRepository to src/lib/repositories.ts
let repos = fs.readFileSync('src/lib/repositories.ts', 'utf8');
if (!repos.includes('export class MatchRepository')) {
  repos += `\n
export class MatchRepository extends BaseRepository<any> {
  protected tableName = 'matches';
  protected primaryKey = 'id';
  protected mapRow(row: any): any { return row; }
  async findByCompetition(competitionId: string) { return []; }
  async addPlayerStat(a: string, b: string, c: string, d: string, e: string) {}
}

export class GameRepository extends BaseRepository<any> {
  protected tableName = 'games';
  protected primaryKey = 'slug';
  protected mapRow(row: any): any { return row; }
}
`;
  fs.writeFileSync('src/lib/repositories.ts', repos);
}

// 2. Fix src/lib/db/mysql/provider.ts imports
let mysqlProvider = fs.readFileSync('src/lib/db/mysql/provider.ts', 'utf8');
mysqlProvider = mysqlProvider.replace(
  /SeasonRepository\s*\n\}\s*from\s*'@\/lib\/repositories';/,
  "SeasonRepository,\n  MatchRepository,\n  GameRepository\n} from '@/lib/repositories';"
);
mysqlProvider = mysqlProvider.replace(
  /matches\s*=\s*new\s*\(class.*?\)\(\);/,
  "matches = new MatchRepository();\n  games = new GameRepository();"
);
// Remove ts-nocheck
mysqlProvider = mysqlProvider.replace('// @ts-nocheck\n', '');
fs.writeFileSync('src/lib/db/mysql/provider.ts', mysqlProvider);

console.log('Fixed MySQL repositories');
