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
  positions: string[];
  bannerUrl: string;
  logoUrl: string;         // Local path to logo PNG/SVG (e.g. /images/games/valorant.png)
  teamBadgeText?: string;
  teamTitle?: string;
  teamHighlightTitle?: string;
  teamDescription?: string;
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
    brandColor: '#FF4654',       // Official Valorant Crimson Red
    accentColor: '#BA3A46',      // Dark Crimson Accent
    secondaryAccent: '#111823',  // Official Tactical Dark
    darkBg: '#111823',
    bgGradient: 'from-[#FF4654]/25 via-[#111823] to-[#090D14]',
    positions: ['Duelista', 'Controlador', 'Iniciador', 'Centinela'],
    bannerUrl: '/images/games-background/valorant.jpg',
    logoUrl: '/images/games/valorant.png',
    teamBadgeText: 'Directorio de Escuadras Tácticas 5v5',
    teamTitle: 'ESCUADRAS',
    teamHighlightTitle: 'TÁCTICAS 5v5.',
    teamDescription: 'Conoce todas las organizaciones, escuadras tácticas 5v5 de élite y plantillas oficiales que disputan los campeonatos de VALORANT.',
  },
  eafc26: {
    id: 'eafc26',
    slug: 'eafc26',
    name: 'EA FC 26',
    category: 'Deportes / Fútbol 11v11 & 1v1',
    icon: '⚽',
    tagline: 'La liga definitiva de Clubes Pro 11v11 y 1v1',
    description: 'Compite en la simulación de fútbol más importante del mundo eSports. Torneos 11v11 y 1v1.',
    brandColor: '#077D7E',       // Official EA FC Teal Accent
    accentColor: '#C35B0D',      // Official EA FC Copper-Orange
    secondaryAccent: '#083844',  // Deep EA Navy Teal
    darkBg: '#023031',
    bgGradient: 'from-[#077D7E]/30 via-[#083844] to-[#023031]',
    positions: ['POR', 'DFC', 'LD', 'LI', 'MCD', 'MC', 'MCO', 'EI', 'ED', 'DC'],
    bannerUrl: '/images/games-background/eafc.jpg',
    logoUrl: '/images/games/eafc26.png',
    teamBadgeText: 'Directorio de Clubes eSports FC 26',
    teamTitle: 'DIRECTORIO DE',
    teamHighlightTitle: 'CLUBES ESPORTS.',
    teamDescription: 'Explora las fichas oficiales de los clubes eSports de EA SPORTS FC 26, sus plantillas, trofeos y capitanes asignados.',
  },
  csgo: {
    id: 'csgo',
    slug: 'csgo',
    name: 'COUNTER-STRIKE 2',
    category: 'Tactical Shooter 5v5',
    icon: '🔫',
    tagline: 'Estrategia de precisión y rondas decisivas',
    description: 'El shooter competitivo de Valve por excelencia. Torneos 5v5 y duelos 2v2.',
    brandColor: '#DE9B35',       // CS Gold Accent
    accentColor: '#B57416',
    secondaryAccent: '#1A1813',
    darkBg: '#1A1813',
    bgGradient: 'from-[#DE9B35]/25 via-[#1A1813] to-[#0F0E0B]',
    positions: ['AWPer', 'Entry Fragger', 'IGL', 'Support', 'Lurker'],
    bannerUrl: '/images/games-background/csgo.jpg',
    logoUrl: '/images/games/csgo.png',
    teamBadgeText: 'Directorio de Equipos CS2 5v5',
    teamTitle: 'EQUIPOS',
    teamHighlightTitle: 'COMPETITIVOS CS2.',
    teamDescription: 'Consulta las alineaciones oficiales de Counter-Strike 2, capitanes y rendimiento en torneos eSports.',
  },
  lol: {
    id: 'lol',
    slug: 'lol',
    name: 'LEAGUE OF LEGENDS',
    category: 'MOBA 5v5',
    icon: '⚔️',
    tagline: 'Estrategia en la Grieta del Invocador',
    description: 'El MOBA más popular de Riot Games. Competencia en equipo 5v5.',
    brandColor: '#0AC8B9',       // LoL Hextech Cyan
    accentColor: '#C8AA6E',      // LoL Gold Accent
    secondaryAccent: '#091428',
    darkBg: '#091428',
    bgGradient: 'from-[#0AC8B9]/25 via-[#091428] to-[#030914]',
    positions: ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'],
    bannerUrl: '/images/games-background/lol.jpg',
    logoUrl: '/images/games/lol.png',
    teamBadgeText: 'Directorio de Escuadras MOBA 5v5',
    teamTitle: 'ESCUADRAS',
    teamHighlightTitle: 'DE LA GRIETA.',
    teamDescription: 'Revisa las plantillas de League of Legends, campeonatos disputados y capitanes asignados.',
  },
  rocketleague: {
    id: 'rocketleague',
    slug: 'rocketleague',
    name: 'ROCKET LEAGUE',
    category: 'Deporte Vehicular 3v3',
    icon: '🏎️',
    tagline: 'Fútbol de alta velocidad en vehículos impulsados',
    description: 'El deporte de acción vehicular definitivo de Psyonix. Torneos 3v3, 2v2 y 1v1.',
    brandColor: '#0084FF',       // Rocket League Bright Blue
    accentColor: '#FF6C00',      // Rocket League Orange
    secondaryAccent: '#0B1E36',
    darkBg: '#0B1E36',
    bgGradient: 'from-[#0084FF]/25 via-[#0B1E36] to-[#040C17]',
    positions: ['Delantero', 'Defensa', 'Rotador Global'],
    bannerUrl: '/images/games-background/rocketleague.jpg',
    logoUrl: '/images/games/rocketleague.png',
    teamBadgeText: 'Directorio de Equipos Vehiculares 3v3',
    teamTitle: 'EQUIPOS',
    teamHighlightTitle: 'DE ALTA VELOCIDAD.',
    teamDescription: 'Directorio de clubes de Rocket League compitiendo en arenas oficiales.',
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
    darkBg: '#120E29',
    bgGradient: 'from-[#9d4dbb]/30 via-[#4c51f7]/25 to-[#f3af19]/20',
    positions: ['IGL', 'Fragger', 'Support', 'Anchor'],
    bannerUrl: '/images/games-background/fortnite.jpg',
    logoUrl: '/images/games/fortnite.png',
    teamBadgeText: 'Directorio de Escuadras Battle Royale',
    teamTitle: 'ESCUADRAS',
    teamHighlightTitle: 'BATTLE ROYALE.',
    teamDescription: 'Conoce las escuadras y atletas que compiten en las arenas de Fortnite.',
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
