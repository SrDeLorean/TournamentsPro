import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { getRequestUserSession } from './src/lib/auth-server';
import { dbProvider } from './src/lib/db/provider';
import { NextRequest } from 'next/server';

async function test() {
  try {
    const req = new NextRequest('http://localhost:3000/api/auth/session', {
      headers: {
        'cookie': 'tp_session=dummy'
      }
    });
    
    console.log("DB Provider: ", process.env.DATABASE_PROVIDER);
    
    // Test direct DB query first to isolate issues
    try {
      const user = await dbProvider.users.findById('usr-admin');
      console.log('User query successful:', !!user);
    } catch(e) {
      console.error('DB User Query Error:', e);
    }
    
    // Now test session lookup
    try {
      const session = await getRequestUserSession(req as any);
      console.log('Session lookup successful:', !!session);
    } catch (e) {
      console.error('Session Lookup Error:', e);
    }
  } catch(e) {
    console.error('General Error:', e);
  }
}

test();
