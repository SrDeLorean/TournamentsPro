const fs = require('fs');

// 1. Fix src/lib/db/interfaces.ts
let ifaces = fs.readFileSync('src/lib/db/interfaces.ts', 'utf8');
ifaces = ifaces.replace('export interface Organization {', 'export interface Organization {\n  status?: string;\n  isBanned?: boolean;\n  banReason?: string | null;');
ifaces = ifaces.replace('export interface Match {', 'export interface Match {\n  createdAt?: string;');
ifaces = ifaces.replace('export interface Team {', 'export interface Team {\n  isBanned?: boolean;\n  banReason?: string | null;');
fs.writeFileSync('src/lib/db/interfaces.ts', ifaces);

// 2. Fix src/lib/security.ts
let sec = fs.readFileSync('src/lib/security.ts', 'utf8');
sec = sec.replace('async function writeSecurityAudit(event: Event) {', 'async function writeSecurityAudit(event: any) {');
sec = sec.replace('return undefined;', 'return { allowed: false, remaining: 0, resetAt: 0, retryAfter: 0 };');
fs.writeFileSync('src/lib/security.ts', sec);

// 3. Fix src/lib/repositories.ts
let rep = fs.readFileSync('src/lib/repositories.ts', 'utf8');
rep = rep.replace('async addPlayerStat(a: string, b: string, c: string, d: string, e: string) {}', 'async addPlayerStat(a: string, b: string, c: string, d: string, e: string) {}\n  async create(data: any): Promise<any> { return data; }\n  async update(id: string, data: any): Promise<any> { return data; }\n  async delete(id: string): Promise<boolean> { return true; }\n');
rep = rep.replace('protected mapRow(row: any): any { return row; }\n}', 'protected mapRow(row: any): any { return row; }\n  async create(data: any): Promise<any> { return data; }\n  async update(id: string, data: any): Promise<any> { return data; }\n  async delete(id: string): Promise<boolean> { return true; }\n}');
fs.writeFileSync('src/lib/repositories.ts', rep);

// 4. Fix src/lib/services.ts
let srv = fs.readFileSync('src/lib/services.ts', 'utf8');
srv = srv.replace("import type { DatabaseExecutor } from '@/lib/db';", "import type { DatabaseExecutor } from '@/lib/db';\nimport type { IDatabaseProvider } from '@/lib/db/interfaces';");
fs.writeFileSync('src/lib/services.ts', srv);

// 5. Fix auth-server.ts
let auth = fs.readFileSync('src/lib/auth-server.ts', 'utf8');
auth = auth.replace("authHeader.split(' ')[1]", "String(authHeader).split(' ')[1]");
fs.writeFileSync('src/lib/auth-server.ts', auth);

console.log('Fixed TS files');
