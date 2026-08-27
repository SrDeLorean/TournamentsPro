import { describe, expect, it } from 'vitest';

import {
  compareState,
  decideMigrationStrategy,
  splitMigrationsAroundBaseline,
  validateBaselineSql,
} from '../database/migration-core.mjs';

describe('migration runner strategy', () => {
  it('bootstraps a genuinely empty schema', () => {
    expect(decideMigrationStrategy([], [])).toBe('bootstrap');
    expect(decideMigrationStrategy(['schema_migrations'], [])).toBe('bootstrap');
    expect(decideMigrationStrategy(['schema_baselines'], [])).toBe('bootstrap');
  });

  it('keeps an untracked legacy installation on the incremental upgrade path', () => {
    expect(decideMigrationStrategy(['users', 'teams'], [])).toBe('upgrade');
  });

  it('never reapplies the baseline after migrations have been recorded', () => {
    expect(decideMigrationStrategy(['schema_migrations'], [{ version: '0001' }])).toBe('upgrade');
  });

  it('rejects a baseline that can select or create a different database', () => {
    expect(() => validateBaselineSql('CREATE DATABASE dangerous;')).toThrow(/CREATE DATABASE/i);
    expect(() => validateBaselineSql('USE dangerous;')).toThrow(/USE/i);
  });

  it('detects pending migrations and checksum drift deterministically', () => {
    const migrations = [
      { version: '0001', name: '0001_first.sql', checksum: 'one' },
      { version: '0002', name: '0002_second.sql', checksum: 'two' },
    ];

    expect(compareState(migrations, [{ version: '0001', name: '0001_first.sql', checksum: 'one' }])).toMatchObject({
      drift: [],
      pending: [migrations[1]],
    });
    expect(compareState(migrations, [{ version: '0001', name: '0001_first.sql', checksum: 'changed' }]).drift)
      .toEqual(['0001_first.sql']);
  });

  it('applies migrations newer than the immutable baseline during bootstrap', () => {
    const migrations = [
      { version: '0005', name: '0005_baseline.sql' },
      { version: '0006', name: '0006_expand.sql' },
    ];
    expect(splitMigrationsAroundBaseline(migrations, '0005')).toEqual({
      reconciled: [migrations[0]],
      pending: [migrations[1]],
    });
  });
});
