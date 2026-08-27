import { describe, expect, it } from 'vitest';
import { getDirectoryEndpoint } from '../src/lib/directory-endpoints';

describe('public directory routing', () => {
  it.each([
    ['users', '/api/users?limit=200'],
    ['teams', '/api/teams?limit=200'],
    ['organizations', '/api/organizations'],
  ] as const)('keeps anonymous %s reads on public APIs', (resource, expected) => {
    expect(getDirectoryEndpoint(resource, false)).toBe(expected);
  });

  it.each([
    ['users', '/api/admin/users'],
    ['teams', '/api/admin/teams'],
    ['organizations', '/api/admin/organizations'],
  ] as const)('uses protected %s APIs only for managers', (resource, expected) => {
    expect(getDirectoryEndpoint(resource, true)).toBe(expected);
  });
});
