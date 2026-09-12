import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(new URL('../supabase_permissions.sql', import.meta.url), 'utf8')
  .replace(/--[^\n]*/g, '')
  .replace(/\s+/g, ' ');

describe('Supabase minimum privilege SQL contract', () => {
  it('revokes historical and future public access to application data', () => {
    expect(sql).toMatch(/REVOKE ALL ON SCHEMA public FROM PUBLIC, anon, authenticated;/i);
    for (const kind of ['TABLES', 'SEQUENCES', 'ROUTINES']) {
      expect(sql).toMatch(new RegExp(`REVOKE ALL PRIVILEGES ON ALL ${kind} IN SCHEMA public FROM PUBLIC, anon, authenticated;`, 'i'));
      expect(sql).toMatch(new RegExp(`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON ${kind} FROM anon, authenticated;`, 'i'));
    }
    expect(sql).toMatch(/ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;/i);
    expect(sql).not.toMatch(/\bGRANT\b[^;]+\bTO\s+(?:PUBLIC|anon|authenticated)\b/i);
  });

  it('limits the privileged rate-limit function to service_role', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.consume_security_rate_limit\(/i);
    expect(sql).toMatch(/SECURITY DEFINER SET search_path = public/i);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.consume_security_rate_limit\([^;]+FROM PUBLIC, anon, authenticated;/i);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.consume_security_rate_limit\([^;]+TO service_role;/i);
  });
});
