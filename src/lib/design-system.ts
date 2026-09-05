export const DESIGN_STORAGE_KEY = 'tournamentspro:design:v4';

export const DESIGN_DENSITIES = ['compact', 'comfortable', 'spacious'] as const;
export const DESIGN_RADII = ['sharp', 'soft', 'rounded'] as const;
export const DESIGN_MOTIONS = ['reduced', 'standard', 'expressive'] as const;
export const DESIGN_FONTS = ['outfit', 'jakarta', 'sora', 'space-grotesk', 'inter'] as const;
export const DESIGN_ACCENT_PRESETS = ['#DC2011', '#8F0B13', '#380F17', '#D9A441', '#5F8F72', '#718096'] as const;

export type DesignDensity = (typeof DESIGN_DENSITIES)[number];
export type DesignRadius = (typeof DESIGN_RADII)[number];
export type DesignMotion = (typeof DESIGN_MOTIONS)[number];
export type DesignFont = (typeof DESIGN_FONTS)[number];

export const FONT_DEFINITIONS: Record<
  DesignFont,
  {
    id: DesignFont;
    name: string;
    tagline: string;
    familyCss: string;
    dna: string;
    bestFor: string;
    badge: string;
  }
> = {
  outfit: {
    id: 'outfit',
    name: 'Outfit',
    tagline: 'Geometría eSports Dinámica (Default)',
    familyCss: 'var(--font-outfit), ui-sans-serif, system-ui, sans-serif',
    dna: 'Curvas equilibradas, números legibles para marcadores, look deportivo contemporáneo.',
    bestFor: 'Identidad general de torneos, banners y tarjetas competitivas.',
    badge: 'Recomendada eSports',
  },
  jakarta: {
    id: 'jakarta',
    name: 'Plus Jakarta Sans',
    tagline: 'Precisión Deportiva & SaaS Pro',
    familyCss: 'var(--font-jakarta), var(--font-outfit), ui-sans-serif, system-ui, sans-serif',
    dna: 'Grotesco geométrico limpio, tracking perfecto y máxima claridad en datos y tablas.',
    bestFor: 'Dashboards de organizadores, actas de partido y analítica táctica.',
    badge: 'Alta Legibilidad',
  },
  sora: {
    id: 'sora',
    name: 'Sora',
    tagline: 'Cibernética de Alta Gama & Premium Gaming',
    familyCss: 'var(--font-sora), var(--font-outfit), ui-sans-serif, system-ui, sans-serif',
    dna: 'Terminales abiertas, estética futurista sobria y jerarquía visual dominante en titulares.',
    bestFor: 'Escenarios principales de torneos mayores, streams y branding tech.',
    badge: 'Futurista Premium',
  },
  'space-grotesk': {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    tagline: 'Brutalismo Tecnológico & Cyber Arena',
    familyCss: 'var(--font-space-grotesk), var(--font-outfit), ui-sans-serif, system-ui, sans-serif',
    dna: 'Rasgos de terminal proporcional con acento cyber, máxima energía competitiva.',
    bestFor: 'Marcadores en vivo, brackets eSports y torneos de FPS (CS2 / Valorant).',
    badge: 'Gaming Hardcore',
  },
  inter: {
    id: 'inter',
    name: 'Inter',
    tagline: 'Máxima Densidad de Información & Neutralidad',
    familyCss: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
    dna: 'Micro-diseño optimizado para pantallas, renderizado nítido en tamaños reducidos.',
    bestFor: 'Gestión masiva de datos, tablas de fixture de 64 equipos y configuración.',
    badge: 'Neutral Táctica',
  },
};

export interface DesignPreferences {
  accentColor: string;
  density: DesignDensity;
  radius: DesignRadius;
  motion: DesignMotion;
  font: DesignFont;
  scale: number;
  surfaceOpacity: number;
  blur: number;
}

export const DEFAULT_DESIGN_PREFERENCES: DesignPreferences = {
  accentColor: '#DC2011',
  density: 'comfortable',
  radius: 'soft',
  motion: 'standard',
  font: 'outfit',
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
    font: DESIGN_FONTS.includes(candidate.font as DesignFont)
      ? (candidate.font as DesignFont)
      : DEFAULT_DESIGN_PREFERENCES.font,
    scale: boundedNumber(candidate.scale, DEFAULT_DESIGN_PREFERENCES.scale, 90, 110),
    surfaceOpacity: boundedNumber(candidate.surfaceOpacity, DEFAULT_DESIGN_PREFERENCES.surfaceOpacity, 55, 100),
    blur: boundedNumber(candidate.blur, DEFAULT_DESIGN_PREFERENCES.blur, 0, 30),
  };
}

export function designPreferencesToCss(preferences: DesignPreferences): Record<string, string> {
  const fontDef = FONT_DEFINITIONS[preferences.font] || FONT_DEFINITIONS.outfit;
  return {
    '--ui-scale': String(preferences.scale / 100),
    '--ui-surface-opacity': String(preferences.surfaceOpacity / 100),
    '--ui-blur': `${preferences.blur}px`,
    '--ui-accent': preferences.accentColor,
    '--font-sans': fontDef.familyCss,
    '--font-active': fontDef.familyCss,
  };
}
