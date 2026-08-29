const fs = require('fs');

let code = fs.readFileSync('src/lib/auth-server.ts', 'utf8');

const loadServerUserReplace = `
async function loadServerUser(userId: string): Promise<ServerUserSession | null> {
  const user = await import('./db/provider').then(m => m.dbProvider.users.findById(userId));
  
  if (!user || user.isBanned || user.status === 'Baneado' || user.status === 'Suspendido') {
    return null;
  }

  // Find owned org if any
  const ownedOrgs = await import('./db/provider').then(m => m.dbProvider.organizations.findAll({ where: { owner_id: userId }, limit: 1 }));
  const owned_org_id = ownedOrgs[0]?.id || null;

  const organizationId = user.organizationId || owned_org_id || null;
  let allowedGames: string[] = [];

  if (organizationId) {
    const org = await import('./db/provider').then(m => m.dbProvider.organizations.findById(organizationId));
    if (org && org.allowedGames) {
      if (Array.isArray(org.allowedGames)) {
        allowedGames = org.allowedGames as string[];
      } else if (typeof org.allowedGames === 'string') {
        try {
          const parsed = JSON.parse(org.allowedGames);
          allowedGames = Array.isArray(parsed) ? parsed : [];
        } catch {
          allowedGames = org.allowedGames.split(',').map((g: string) => g.trim()).filter(Boolean);
        }
      }
    }
  }

  return {
    userId: user.id,
    name: user.name,
    role: user.role,
    organizationId,
    allowedGames,
  };
}
`;

code = code.replace(/async function loadServerUser.*?return \{.*?userId: user\.id,.*?name: user\.name,.*?role: user\.role,.*?organizationId,.*?allowedGames,.*?\};\r?\n\}/s, loadServerUserReplace.trim());

fs.writeFileSync('src/lib/auth-server.ts', code);
console.log('Patched loadServerUser in auth-server.ts');
