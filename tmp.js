const fs = require('fs');
const text = fs.readFileSync('supabase_data.sql', 'utf8');
const tables = new Set();
const regex = /INSERT INTO \"([^\"]+)\"/g;
let match;
while ((match = regex.exec(text)) !== null) {
  tables.add(match[1]);
}
console.log(Array.from(tables).join(', '));
