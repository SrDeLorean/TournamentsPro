export const DESIGN_STORAGE_KEY = 'tournamentspro:design:v1';

export const DESIGN_DENSITIES = ['compact', 'comfortable', 'spacious'] as const;
export const DESIGN_RADII = ['sharp', 'soft', 'rounded'] as const;
export const DESIGN_MOTIONS = ['reduced', 'standard', 'expressive'] as const;

export type DesignDensity = (typeof DESIGN_DENSITIES)[number];
export type DesignRadius = (typeof DESIGN_RADII)[number];
export type DesignMotion = (typeof DESIGN_MOTIONS)[number];

export interface DesignPreferences {
  accentColor: string;
  density: DesignDensity;
  radius: DesignRadius;
  motion: DesignMotion;
  scale: number;
  surfaceOpacity: number;
  blur: number;
}

export const DEFAULT_DESIGN_PREFERENCES: DesignPreferences = {
  accentColor: '#22d3ee',
  density: 'comfortable',
  radius: 'soft',
  motion: 'standard',
  scale: 100,
  surfaceOpacity: 82,
  blur: 18,
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function boundedNumber(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback;
}

export function normalizeDesignPreferences(value: unknown): DesignPreferences {
  if (!value || typeof value !== 'object') return DEFAULT_DESIGN_PREFERENCES;
  const candidate = value as Partial<DesignPreferences>;

  return {
    accentColor: typeof candidate.accentColor === 'string' && HEX_COLOR.test(candidate.accentColor)
      ? candidate.accentColor
      : DEFAULT_DESIGN_PREFERENCES.accentColor,
    density: DESIGN_DENSITIES.includes(candidate.density as DesignDensity)
      ? candidate.density as DesignDensity
      : DEFAULT_DESIGN_PREFERENCES.density,
    radius: DESIGN_RADII.includes(candidate.radius as DesignRadius)
      ? candidate.radius as DesignRadius
      : DEFAULT_DESIGN_PREFERENCES.radius,
    motion: DESIGN_MOTIONS.includes(candidate.motion as DesignMotion)
      ? candidate.motion as DesignMotion
      : DEFAULT_DESIGN_PREFERENCES.motion,
    scale: boundedNumber(candidate.scale, DEFAULT_DESIGN_PREFERENCES.scale, 90, 110),
    surfaceOpacity: boundedNumber(candidate.surfaceOpacity, DEFAULT_DESIGN_PREFERENCES.surfaceOpacity, 55, 100),
    blur: boundedNumber(candidate.blur, DEFAULT_DESIGN_PREFERENCES.blur, 0, 30),
  };
}

export function designPreferencesToCss(preferences: DesignPreferences): Record<string, string> {
  return {
    '--ui-scale': String(preferences.scale / 100),
    '--ui-surface-opacity': String(preferences.surfaceOpacity / 100),
    '--ui-blur': `${preferences.blur}px`,
    '--ui-accent': preferences.accentColor,
  };
}
