export interface GameSemanticPalette {
  brandPrimary: string;    // --app-accent
  brandSecondary: string;  // --app-accent-2
  brandDeep: string;       // --brand-900
  success: string;         // --accent-success
  warning: string;         // --accent-warning
  danger: string;          // --accent-crimson
  canvas: string;          // --bg-main
  surface: string;         // --bg-card
  border: string;          // --border-card
}

export const SYSTEM_SEMANTIC_PALETTE: GameSemanticPalette = {
  brandPrimary: '#DC2011',
  brandSecondary: '#8F0B13',
  brandDeep: '#380F17',
  success: '#5F8F72',
  warning: '#D9A441',
  danger: '#DC2011',
  canvas: '#111414',
  surface: '#252B2B',
  border: '#4C4F54',
};

export interface GameConfig {
  id: string;
  slug: string;
  name: string;
  category: string;
  icon: string;
  tagline: string;
  description: string;
  brandColor: string;      // Main Brand Color
  accentColor: string;     // Secondary Vibrant Accent
  secondaryAccent: string; // Complementary Accent Color
  darkBg: string;          // Official Dark Theme Background
  bgGradient: string;
  palette: string[];       // Official 5-color palette
  semanticPalette: GameSemanticPalette; // 9 balanced semantic colors matching system roles
  positions: string[];
  bannerUrl: string;
  backdropPosition?: string;
  backdropPositionMobile?: string;
  logoUrl: string;         // Local path to logo PNG/SVG (e.g. /images/games/valorant.png)
  teamBadgeText?: string;
  teamTitle?: string;
  teamHighlightTitle?: string;
  teamDescription?: string;
  visualTheme: {
    /** Short art-direction label surfaced in UI previews. */
    scene: string;
    /** Small visual vocabulary used by cards and downloadable identity sheets. */
    motif: string;
    glow: string;
    highlight: string;
  };
}

export const GAMES_CATALOG: Record<string, GameConfig> = {
  valorant: {
    id: 'valorant',
    slug: 'valorant',
    name: 'VALORANT',
    category: 'Tactical FPS 5v5',
    icon: '🎯',
    tagline: 'Precisión táctica y habilidades definitivas',
    description: 'El shooter táctico 5v5 de Riot Games donde la puntería y las habilidades cambian la partida.',
    brandColor: '#ff4654',       // Valorant Crimson Red
    accentColor: '#ba3a46',      // Dark Crimson Accent
    secondaryAccent: '#111823',  // Tactical Dark
    darkBg: '#111823',           // Official Tactical Dark
    bgGradient: 'from-[#ff4654]/25 via-[#ba3a46]/20 to-[#111823]',
    palette: ['#ff4654', '#ba3a46', '#111823', '#ffffff', '#111823'],
    semanticPalette: {
      brandPrimary: '#ff4654',
      brandSecondary: '#ba3a46',
      brandDeep: '#381419',
      success: '#46c291',
      warning: '#ffb84d',
      danger: '#ff4654',
      canvas: '#0f141c',
      surface: '#1a2230',
      border: '#354256',
    },
    positions: ['Duelista', 'Controlador', 'Iniciador', 'Centinela'],
    bannerUrl: '/images/games-background/valorant.jpg',
    backdropPosition: 'center top',
    backdropPositionMobile: '56% top',
    logoUrl: '/images/games/valorant.png',
    teamBadgeText: 'Directorio de Escuadras Tácticas 5v5',
    teamTitle: 'ESCUADRAS',
    teamHighlightTitle: 'TÁCTICAS 5v5.',
    teamDescription: 'Conoce todas las organizaciones, escuadras tácticas 5v5 de élite y plantillas oficiales que disputan los campeonatos de VALORANT.',
    visualTheme: { scene: 'Corte táctico', motif: 'Láminas angulares', glow: '#ff4654', highlight: '#ffffff' },
  },
  eafc26: {
    id: 'eafc26',
    slug: 'eafc26',
    name: 'EA FC 26',
    category: 'Deportes / Fútbol 11v11 & 1v1',
    icon: '⚽',
    tagline: 'La liga definitiva de Clubes Pro 11v11 y 1v1',
    description: 'Compite en la simulación de fútbol más importante del mundo eSports. Torneos 11v11 y 1v1.',
    brandColor: '#077d7e',       // EA FC Vibrant Teal Accent
    accentColor: '#c35b0d',      // Copper Orange Accent
    secondaryAccent: '#a64607',  // Deep Rust Amber
    darkBg: '#023031',           // Deep Pitch Dark Teal
    bgGradient: 'from-[#077d7e]/30 via-[#083844] to-[#023031]',
    palette: ['#023031', '#083844', '#077d7e', '#a64607', '#c35b0d'],
    semanticPalette: {
      brandPrimary: '#077d7e',
      brandSecondary: '#055859',
      brandDeep: '#032627',
      success: '#10b981',
      warning: '#c35b0d',
      danger: '#dc2011',
      canvas: '#0b1314',
      surface: '#162223',
      border: '#2d4244',
    },
    positions: ['POR', 'DFC', 'LD', 'LI', 'MCD', 'MC', 'MCO', 'EI', 'ED', 'DC'],
    bannerUrl: '/images/games-background/eafc.jpg',
    backdropPosition: 'center top',
    backdropPositionMobile: '48% top',
    logoUrl: '/images/games/eafc26.png',
    teamBadgeText: 'Directorio de Clubes eSports FC 26',
    teamTitle: 'DIRECTORIO DE',
    teamHighlightTitle: 'CLUBES ESPORTS.',
    teamDescription: 'Explora las fichas oficiales de los clubes eSports de EA SPORTS FC 26, sus plantillas, trofeos y capitanes asignados.',
    visualTheme: { scene: 'Estadio orbital', motif: 'Táctica de campo', glow: '#077d7e', highlight: '#c35b0d' },
  },
  csgo: {
    id: 'csgo',
    slug: 'csgo',
    name: 'COUNTER-STRIKE 2',
    category: 'Tactical Shooter 5v5',
    icon: '🔫',
    tagline: 'Estrategia de precisión y rondas decisivas',
    description: 'El shooter competitivo de Valve por excelencia. Torneos 5v5 y duelos 2v2.',
    brandColor: '#de9b35',       // T-Side Amber Gold Accent
    accentColor: '#5d79ae',      // CT Tactical Blue
    secondaryAccent: '#413a27',  // Dark Khaki / Olive
    darkBg: '#0c0f12',           // Steel Dark Charcoal
    bgGradient: 'from-[#de9b35]/25 via-[#5d79ae]/20 to-[#0c0f12]',
    palette: ['#5d79ae', '#0c0f12', '#ccba7c', '#413a27', '#de9b35'],
    semanticPalette: {
      brandPrimary: '#de9b35',
      brandSecondary: '#a86e1b',
      brandDeep: '#332107',
      success: '#4bb543',
      warning: '#de9b35',
      danger: '#e24b4b',
      canvas: '#0e1115',
      surface: '#1a2027',
      border: '#364250',
    },
    positions: ['AWPer', 'Entry Fragger', 'IGL', 'Support', 'Lurker'],
    bannerUrl: '/images/games-background/csgo.jpg',
    backdropPosition: 'center top',
    backdropPositionMobile: '58% top',
    logoUrl: '/images/games/csgo.png',
    teamBadgeText: 'Directorio de Equipos CS2 5v5',
    teamTitle: 'EQUIPOS',
    teamHighlightTitle: 'COMPETITIVOS CS2.',
    teamDescription: 'Consulta las alineaciones oficiales de Counter-Strike 2, capitanes y rendimiento en torneos eSports.',
    visualTheme: { scene: 'Forja industrial', motif: 'Retícula de precisión', glow: '#ccba7c', highlight: '#5d79ae' },
  },
  lol: {
    id: 'lol',
    slug: 'lol',
    name: 'LEAGUE OF LEGENDS',
    category: 'MOBA 5v5',
    icon: '⚔️',
    tagline: 'Estrategia en la Grieta del Invocador',
    description: 'El MOBA más popular de Riot Games. Competencia en equipo 5v5.',
    brandColor: '#d39542',       // Warm Gold / Amber Accent
    accentColor: '#783f04',      // Deep Bronze
    secondaryAccent: '#221f40',  // Deep Violet Shadow
    darkBg: '#221f40',           // Deep Violet Void
    bgGradient: 'from-[#d39542]/30 via-[#783f04]/25 to-[#221f40]',
    palette: ['#783f04', '#d39542', '#fff4bf', '#221f40', '#c4c4a5'],
    semanticPalette: {
      brandPrimary: '#d39542',
      brandSecondary: '#8c5a1e',
      brandDeep: '#2b1905',
      success: '#3cd070',
      warning: '#e0b354',
      danger: '#e84057',
      canvas: '#0b0c15',
      surface: '#161726',
      border: '#343652',
    },
    positions: ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'],
    bannerUrl: '/images/games-background/lol.jpg',
    backdropPosition: 'center top',
    backdropPositionMobile: '52% top',
    logoUrl: '/images/games/lol.webp',
    teamBadgeText: 'Directorio de Escuadras MOBA 5v5',
    teamTitle: 'ESCUADRAS',
    teamHighlightTitle: 'DE LA GRIETA.',
    teamDescription: 'Revisa las plantillas de League of Legends, campeonatos disputados y capitanes asignados.',
    visualTheme: { scene: 'Nexo hextech', motif: 'Rutas arcanas', glow: '#fff4bf', highlight: '#c4c4a5' },
  },
  rocketleague: {
    id: 'rocketleague',
    slug: 'rocketleague',
    name: 'ROCKET LEAGUE',
    category: 'Deporte Vehicular 3v3',
    icon: '🏎️',
    tagline: 'Fútbol de alta velocidad en vehículos impulsados',
    description: 'El deporte de acción vehicular definitivo de Psyonix. Torneos 3v3, 2v2 y 1v1.',
    brandColor: '#00bbff',       // Vivid Cyan-Blue
    accentColor: '#0060ff',      // Deep Royal Blue
    secondaryAccent: '#068efc',  // Vivid Cerulean
    darkBg: '#071526',           // Deep Kinetic Blue Dark
    bgGradient: 'from-[#00bbff]/30 via-[#0060ff]/20 to-[#071526]',
    palette: ['#00bbff', '#f6faff', '#0060ff', '#43f8f0', '#068efc'],
    semanticPalette: {
      brandPrimary: '#00bbff',
      brandSecondary: '#0060ff',
      brandDeep: '#051a3b',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
      canvas: '#0a0f17',
      surface: '#131f2e',
      border: '#2a3f5b',
    },
    positions: ['Delantero', 'Defensa', 'Rotador Global'],
    bannerUrl: '/images/games-background/rocketleague.jpg',
    backdropPosition: 'center top',
    backdropPositionMobile: '50% top',
    logoUrl: '/images/games/rocketleague.png',
    teamBadgeText: 'Directorio de Equipos Vehiculares 3v3',
    teamTitle: 'EQUIPOS',
    teamHighlightTitle: 'DE ALTA VELOCIDAD.',
    teamDescription: 'Directorio de clubes de Rocket League compitiendo en arenas oficiales.',
    visualTheme: { scene: 'Órbita cinética', motif: 'Estela turbo', glow: '#43f8f0', highlight: '#f6faff' },
  },
  fortnite: {
    id: 'fortnite',
    slug: 'fortnite',
    name: 'FORTNITE',
    category: 'Battle Royale & Cero Construcción',
    icon: '⚡',
    tagline: 'Sobrevive y domina en la Isla',
    description: 'El Battle Royale insignia de Epic Games. Modalidades Solo, Dúos, Tríos y Escuadrones.',
    brandColor: '#9d4dbb',       // Fortnite Epic Purple (#9d4dbb)
    accentColor: '#f3af19',      // Fortnite Legendary Gold (#f3af19)
    secondaryAccent: '#4c51f7',  // Fortnite Rare Blue (#4c51f7)
    darkBg: '#120e29',           // Storm Violet Dark
    bgGradient: 'from-[#9d4dbb]/30 via-[#4c51f7]/25 to-[#f3af19]/20',
    palette: ['#ffffff', '#319236', '#4c51f7', '#9d4dbb', '#f3af19'],
    semanticPalette: {
      brandPrimary: '#9d4dbb',
      brandSecondary: '#6a2e82',
      brandDeep: '#2d0f38',
      success: '#319236',
      warning: '#f3af19',
      danger: '#e11d48',
      canvas: '#0e0b16',
      surface: '#1a1526',
      border: '#3e3255',
    },
    positions: ['IGL', 'Fragger', 'Support', 'Anchor'],
    bannerUrl: '/images/games-background/fortnite.jpg',
    backdropPosition: 'center top',
    backdropPositionMobile: '54% top',
    logoUrl: '/images/games/fortnite.png',
    teamBadgeText: 'Directorio de Escuadras Battle Royale',
    teamTitle: 'ESCUADRAS',
    teamHighlightTitle: 'BATTLE ROYALE.',
    teamDescription: 'Conoce las escuadras y atletas que compiten en las arenas de Fortnite.',
    visualTheme: { scene: 'Isla suspendida', motif: 'Descenso prismático', glow: '#f3af19', highlight: '#319236' },
  },
};

export interface GameModeOption {
  value: string;
  label: string;
  isIndividual: boolean;
}

export const GAME_MODE_OPTIONS: Record<string, GameModeOption[]> = {
  eafc26: [
    { value: '11v11', label: 'Clubes Pro 11v11 (Equipos / Clubes)', isIndividual: false },
    { value: '2v2', label: 'Parejas 2v2 (Jugadores Directos)', isIndividual: true },
    { value: '1v1', label: 'Solo 1v1 (Jugadores Directos)', isIndividual: true },
  ],
  lol: [
    { value: '5v5', label: 'Grieta del Invocador 5v5 (Equipos / Clubes)', isIndividual: false },
    { value: '3v3', label: 'Bosque Retorcido / ARAM 3v3 (Equipos)', isIndividual: false },
    { value: '1v1', label: 'Duelo 1v1 (Jugadores Directos)', isIndividual: true },
  ],
  rocketleague: [
    { value: '4v4', label: 'Caos 4v4 (Equipos)', isIndividual: false },
    { value: '3v3', label: 'Estándar 3v3 (Equipos)', isIndividual: false },
    { value: '2v2', label: 'Parejas 2v2 (Jugadores Directos)', isIndividual: true },
    { value: '1v1', label: 'Solo 1v1 (Jugadores Directos)', isIndividual: true },
  ],
  csgo: [
    { value: '5v5', label: 'Táctico Estándar 5v5 (Equipos / Clubes)', isIndividual: false },
  ],
  valorant: [
    { value: '5v5', label: 'Táctico Estándar 5v5 (Equipos / Clubes)', isIndividual: false },
  ],
  fortnite: [
    { value: 'escuadrones', label: 'Escuadrones 4v4 (Equipos)', isIndividual: false },
    { value: 'trios', label: 'Tríos 3v3 (Equipos)', isIndividual: false },
    { value: 'duos', label: 'Dúos 2v2 (Jugadores Directos)', isIndividual: true },
    { value: 'solo', label: 'Solo 1v1 (Jugadores Directos)', isIndividual: true },
  ],
};

export const GAME_MODES: Record<string, { id: string; name: string; format: string; description: string }[]> = {
  eafc26: [
    { id: '11v11', name: 'Clubes Pro 11v11', format: '11v11', description: 'Formato plantilla completa con posiciones fijas eSports' },
    { id: '1v1', name: 'Ultimate Team 1v1', format: '1v1', description: 'Formato individual competitivo cara a cara' },
    { id: '2v2', name: 'Parejas Co-Op 2v2', format: '2v2', description: 'Formato de duos en línea' },
  ],
  valorant: [
    { id: '5v5_comp', name: 'Competitivo 5v5', format: '5v5', description: 'Modo de torneo estándar al mejor de 24 rondas con prórroga' },
    { id: '5v5_swift', name: 'Swiftplay 5v5', format: '5v5', description: 'Modo rápido al mejor de 9 rondas' },
    { id: 'spikerush', name: 'Spike Rush 5v5', format: '5v5', description: 'Modo dinámico de ritmo acelerado' },
  ],
  csgo: [
    { id: '5v5_match', name: 'Competitivo 5v5', format: '5v5', description: 'Matchmaking MR12 estándar competitivo oficial CS2' },
    { id: '2v2_wingman', name: 'Wingman 2v2', format: '2v2', description: 'Modo compañero en bombsite único' },
  ],
  lol: [
    { id: '5v5_rift', name: 'Grieta del Invocador 5v5', format: '5v5', description: 'Modo competitivo en el mapa principal 5v5' },
    { id: '5v5_aram', name: 'ARAM 5v5', format: '5v5', description: 'Abismo de los Lamentables selección aleatoria' },
  ],
  rocketleague: [
    { id: '3v3_std', name: 'Estándar 3v3', format: '3v3', description: 'Modo de torneo oficial principal Rocket League' },
    { id: '2v2_duo', name: 'Duos 2v2', format: '2v2', description: 'Parejas competitivas en arena' },
    { id: '1v1_solo', name: 'Individual 1v1', format: '1v1', description: 'Duelo individual técnico de control de balón' },
  ],
};
