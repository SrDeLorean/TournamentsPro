const fs = require('fs');
let file = fs.readFileSync('src/app/api/admin/games/route.ts', 'utf8');
file = file.replace(/orderBy: 'createdAt'/g, "orderBy: 'created_at'");
fs.writeFileSync('src/app/api/admin/games/route.ts', file);
console.log('Fixed games route');
