"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("@next/env");
(0, env_1.loadEnvConfig)(process.cwd());
const auth_server_1 = require("./src/lib/auth-server");
const provider_1 = require("./src/lib/db/provider");
const server_1 = require("next/server");
async function test() {
    try {
        const req = new server_1.NextRequest('http://localhost:3000/api/auth/session', {
            headers: {
                'cookie': 'tp_session=dummy'
            }
        });
        console.log("DB Provider: ", process.env.DATABASE_PROVIDER);
        // Test direct DB query first to isolate issues
        try {
            const user = await provider_1.dbProvider.users.findById('usr-admin');
            console.log('User query successful:', !!user);
        }
        catch (e) {
            console.error('DB User Query Error:', e);
        }
        // Now test session lookup
        try {
            const session = await (0, auth_server_1.getRequestUserSession)(req);
            console.log('Session lookup successful:', !!session);
        }
        catch (e) {
            console.error('Session Lookup Error:', e);
        }
    }
    catch (e) {
        console.error('General Error:', e);
    }
}
test();
