const fs = require('fs');
let content = fs.readFileSync('package.json', 'utf8');
content = content.replace(
  '"build": "next build && node scripts/prepare-standalone.mjs"',
  '"build": "next build && node scripts/prepare-standalone.mjs && cp -r .next/static _next_static && mv _next_static _next || true"'
);
fs.writeFileSync('package.json', content);
console.log('Patched package.json');
