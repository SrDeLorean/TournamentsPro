const fs = require('fs');

let file = fs.readFileSync('src/app/api/admin/users/route.ts', 'utf8');
file = file.replace(
  "const isBannedFilter = searchParams.get('isBanned');",
  "const isBannedFilter = searchParams.get('isBanned');\n    const unassignedOrg = searchParams.get('unassignedOrg');"
);
file = file.replace(
  "if (isBannedFilter !== null && isBannedFilter !== undefined) {",
  "if (unassignedOrg === 'true') {\n      where.organization_id = null;\n    }\n    if (isBannedFilter !== null && isBannedFilter !== undefined) {"
);
fs.writeFileSync('src/app/api/admin/users/route.ts', file);

// Now patch organizations-page-client.tsx
let client = fs.readFileSync('src/features/organizations/components/organizations-page-client.tsx', 'utf8');
client = client.replace(
  "fetch('/api/admin/users?role=Organizador')",
  "fetch('/api/admin/users?role=Organizador&unassignedOrg=true')"
);
fs.writeFileSync('src/features/organizations/components/organizations-page-client.tsx', client);

console.log('Patched API and frontend');
