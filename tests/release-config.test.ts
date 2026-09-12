import { describe, expect, it } from 'vitest';
import { inspectReleaseConfig } from '../scripts/check-release-config.mjs';

const validSupabase = {
  DATABASE_PROVIDER: 'supabase',
  JWT_SECRET: 'a-random-secret-that-is-long-enough-12345',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'server-only-secret',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
};

describe('release configuration preflight', () => {
  it('blocks a configured Supabase deployment while atomic transactions are unsupported', () => {
    expect(inspectReleaseConfig(validSupabase).join(' ')).toMatch(/Supabase.*transacciones atómicas/);
  });

  it('fails closed on missing or public server secrets', () => {
    const errors = inspectReleaseConfig({
      ...validSupabase,
      JWT_SECRET: 'replace-with-a-longer-secret',
      SUPABASE_SERVICE_ROLE_KEY: 'public-anon-key',
      NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: 'accidentally-public',
    });
    expect(errors.join(' ')).toMatch(/JWT_SECRET/);
    expect(errors.join(' ')).toMatch(/NEXT_PUBLIC_/);
    expect(errors.join(' ')).toMatch(/anon/);
  });

  it('requires an explicit provider and does not silently default to MySQL', () => {
    expect(inspectReleaseConfig({ JWT_SECRET: validSupabase.JWT_SECRET }).join(' ')).toMatch(/DATABASE_PROVIDER/);
  });

  it('accepts MySQL when the required server configuration is present', () => {
    expect(inspectReleaseConfig({
      DATABASE_PROVIDER: 'mysql',
      JWT_SECRET: validSupabase.JWT_SECRET,
      DB_HOST: 'db.internal',
      DB_USER: 'app',
      DB_PASSWORD: 'a-private-database-password',
      DB_NAME: 'tournamentspro',
    })).toEqual([]);
  });

  it('rejects an empty MySQL password for a production release', () => {
    expect(inspectReleaseConfig({
      DATABASE_PROVIDER: 'mysql',
      JWT_SECRET: validSupabase.JWT_SECRET,
      DB_HOST: 'db.internal',
      DB_USER: 'app',
      DB_PASSWORD: '',
      DB_NAME: 'tournamentspro',
    }).join(' ')).toMatch(/DB_PASSWORD/);
  });
});
