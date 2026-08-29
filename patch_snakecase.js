const fs = require('fs');
let content = fs.readFileSync('src/lib/db/supabase/implementations.ts', 'utf8');
content = content.replace(
  'result[snakeKey] = value;',
  'result[snakeKey] = typeof value === "boolean" ? (value ? 1 : 0) : value;'
);
fs.writeFileSync('src/lib/db/supabase/implementations.ts', content);
console.log('Fixed toSnakeCase');
