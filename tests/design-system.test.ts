import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DESIGN_PREFERENCES,
  designPreferencesToCss,
  normalizeDesignPreferences,
} from '../src/lib/design-system';

describe('design system preferences', () => {
  it('normalizes unsafe persisted values', () => {
    expect(normalizeDesignPreferences({
      accentColor: 'red',
      density: 'tiny',
      radius: 'rounded',
      motion: 'expressive',
      scale: 999,
      surfaceOpacity: 10,
      blur: -4,
    })).toEqual({
      ...DEFAULT_DESIGN_PREFERENCES,
      radius: 'rounded',
      motion: 'expressive',
      scale: 110,
      surfaceOpacity: 55,
      blur: 0,
    });
  });

  it('maps preferences to global CSS custom properties', () => {
    expect(designPreferencesToCss(DEFAULT_DESIGN_PREFERENCES)).toMatchObject({
      '--ui-scale': '1',
      '--ui-surface-opacity': '0.82',
      '--ui-blur': '18px',
      '--ui-accent': '#DC2011',
    });
  });
});
