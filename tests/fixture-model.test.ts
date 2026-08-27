import { describe, expect, it } from 'vitest';
import { getLocalDateString, upperTag } from '../src/features/competitions/fixture/fixture-model';

describe('fixture model helpers', () => {
  it('formats local calendar dates without UTC conversion', () => {
    expect(getLocalDateString(new Date(2026, 7, 27, 23, 30))).toBe('2026-08-27');
  });

  it('creates stable abbreviated tags', () => {
    expect(upperTag('Leviatán')).toBe('LEV');
    expect(upperTag()).toBe('TPG');
  });
});
