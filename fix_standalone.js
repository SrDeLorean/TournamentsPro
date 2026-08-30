const fs = require('fs');

// next.config.ts
let nextConfig = fs.readFileSync('next.config.ts', 'utf8');
nextConfig = nextConfig.replace(/output:\s*['"]standalone['"],?\n?/, '');
fs.writeFileSync('next.config.ts', nextConfig);

// package.json
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts.build = "next build";
pkg.scripts.start = "next start";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

console.log('Removed standalone mode');
