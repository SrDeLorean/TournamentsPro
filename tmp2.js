const fs = require('fs');
const text = fs.readFileSync('supabase_data.sql', 'utf8');
const tables = new Map();
const regex = /INSERT INTO \"([^\"]+)\" \(([^\)]+)\)/g;
let match;
while ((match = regex.exec(text)) !== null) {
  tables.set(match[1], match[2].replace(/\"/g, '').split(', '));
}
for (const [table, columns] of tables.entries()) {
  console.log(table + ': ' + columns.join(', '));
}
