const fs = require('fs');
let content = fs.readFileSync('src/lib/db/supabase/implementations.ts', 'utf8');

const matchClass = `
export class SupabaseMatchRepository extends SupabaseBaseRepository<any> {
  protected tableName = 'matches';
  protected primaryKey = 'id';
  protected mapRow(row: any) { return row; }
  protected mapToDb(entity: any) { return entity; }
  async findByCompetition(competitionId: string) { return []; }
  async addPlayerStat(a: string, b: string, c: string, d: string, e: string) {}
}
`;

const gameClass = `
export class SupabaseGameRepository extends SupabaseBaseRepository<any> {
  protected tableName = 'games';
  protected primaryKey = 'slug';
  protected mapRow(row: any) { return row; }
  protected mapToDb(entity: any) { return entity; }
}
`;

if (!content.includes('export class SupabaseMatchRepository')) {
  content += '\n' + matchClass;
}
if (!content.includes('export class SupabaseGameRepository')) {
  content += '\n' + gameClass;
}
fs.writeFileSync('src/lib/db/supabase/implementations.ts', content);
console.log('Fixed implementations.ts exports');
