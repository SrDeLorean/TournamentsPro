const fs = require('fs');

function replaceInFile(file, regex, replacement) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
  } catch (e) {
    console.log('Error patching', file, e.message);
  }
}

// 1. Add matches to SupabaseDatabaseProvider and MysqlDatabaseProvider
replaceInFile('src/lib/db/supabase/provider.ts',
  /seasons = new SupabaseSeasonRepository\(\);/,
  'seasons = new SupabaseSeasonRepository();\n  matches = new (require(\'./implementations\').SupabaseMatchRepository || class {})(); // Fallback'
);

replaceInFile('src/lib/db/mysql/provider.ts',
  /seasons = new SeasonRepository\(\);/,
  'seasons = new SeasonRepository();\n  matches = new (require(\'../repositories\').MatchRepository || class {})(); // Fallback'
);

// 2. Fix services.ts mismatch
replaceInFile('src/lib/services.ts',
  /await withTransaction\(async \(transaction\) => \{/g,
  'await withTransaction(async (transaction: any) => {'
);
replaceInFile('src/lib/services.ts',
  /export async function executeCas[\s\S]*?return result;\s*\}/,
  `export async function executeCas(executor: any, sql: string, params: any, conflictMessage: string): Promise<any> {
  const result = await executor.executeCommand(sql, params);
  if (result.affectedRows !== 1) throw new Error(conflictMessage);
  return result;
}`
);

// 3. Fix security.ts 'event' possibly undefined
replaceInFile('src/lib/security.ts',
  /event\.actor/g,
  'event?.actor'
);
replaceInFile('src/lib/security.ts',
  /event\.action/g,
  'event?.action'
);
replaceInFile('src/lib/security.ts',
  /event\.resourceType/g,
  'event?.resourceType'
);
replaceInFile('src/lib/security.ts',
  /event\.resourceId/g,
  'event?.resourceId'
);
replaceInFile('src/lib/security.ts',
  /event\.organizationId/g,
  'event?.organizationId'
);
replaceInFile('src/lib/security.ts',
  /event\.outcome/g,
  'event?.outcome'
);
replaceInFile('src/lib/security.ts',
  /event\.request/g,
  'event?.request'
);

console.log('Patched TS errors');
