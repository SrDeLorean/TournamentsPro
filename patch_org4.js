const fs = require('fs');
let file = fs.readFileSync('src/app/api/admin/organizations/route.ts', 'utf8');

file = file.replace(/orderBy: 'createdAt'/g, "orderBy: 'created_at'");
file = file.replace(/where\.isBanned =/g, "where.is_banned =");

fs.writeFileSync('src/app/api/admin/organizations/route.ts', file);
console.log('Fixed API route');
