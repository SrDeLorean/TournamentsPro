'use client';

// Centralized Data Models & State Management Store for TournamentsPro

export interface GameProfile {
  gamertag: string; // Gamertag con el cual se llama en este juego
  gameId: string;   // ID Juego con el cual la API va a buscar los datos
  position?: string; // Posición principal en este juego
  secondaryPosition?: string; // Posición secundaria en este juego
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  gamertag: string;
  role: 'Jugador' | 'Capitán' | 'Organizador' | 'Administrador';
  primaryGame: 'eafc26' | 'valorant' | 'csgo' | 'lol' | 'rocketleague';
  platform: 'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY';
  position: string;            // FC26: DFC/DC, CS2: AWPer, LoL: MID, etc.
  secondaryPosition?: string;
  rankBadge?: string;          // ej: 'Radiante', 'Level 10 Faceit', 'Gran Campeón', 'Division 1'
  teamId?: string;
  teamName?: string;
  organizationId?: string;
  status: string;
  rating: string;
  avatarUrl?: string;
  foto?: string;
  bannerUrl?: string;
  nacionalidad?: string;
  fechaNacimiento?: string;
  telefono?: string;
  biografia?: string;
  championPool?: string[];      // For LoL / Agents for Valorant
  // Redes Sociales & Contacto
  instagram?: string;
  facebook?: string;
  twitch?: string;
  youtube?: string;
  tiktok?: string;
  discord?: string;
  twitter?: string;
  website?: string;
  whatsapp?: string;
  // Perfiles por Juego (Gamertag e ID Juego por cada disciplina)
  gameProfiles?: Record<string, GameProfile>;
}

export interface TournamentRosterEntry {
  id: string;
  tournamentId: string;
  tournamentName: string;
  teamId: string;
  teamName: string;
  gameSlug: string;
  playerId: string;
  playerGamertag: string;
  playerName: string;
  position: string;
  rosterRole: 'TITULAR' | 'SUPLENTE' | 'RESERVA';
}

export interface TeamData {
  id: string;
  name: string;
  tag: string;
  gameSlug: 'eafc26' | 'valorant' | 'csgo' | 'lol' | 'rocketleague';
  captainId: string;
  captainName: string;
  membersCount: number;
  maxMembers: number;          // 45 para FC26, 7 para Shooters/LoL, 4 para RL
  description: string;
  bannerUrl: string;
  logoUrl?: string;
  logoText: string;
  platform: 'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY';
  status: 'ACTIVO' | 'INACTIVO';
  disputando: string;
  palmares: string;
  color: string;
  clubIdEa?: string;
  socialMedia?: {
    twitter?: string;
    instagram?: string;
    twitch?: string;
    youtube?: string;
    discord?: string;
  };
  vacantPositions: string[];   // Roles que el club necesita fichar
  members: UserProfile[];
}

export interface TransferListing {
  id: string;
  type: 'JUGADOR_BUSCA_CLUB' | 'CLUB_RECLUTA_JUGADOR';
  userId?: string;
  userName: string;
  userGamertag: string;
  teamId?: string;
  teamName?: string;
  gameSlug: 'eafc26' | 'valorant' | 'csgo' | 'lol' | 'rocketleague';
  position: string;
  platform: string;
  status: 'DISPONIBLE' | 'CERRADO';
  date: string;
  message: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'Jugador' | 'Capitán' | 'Organizador';
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: 'Jugador' | 'Capitán' | 'Organizador';
  participantAvatar?: string;
  gameSlug?: 'eafc26' | 'valorant' | 'csgo' | 'lol' | 'rocketleague';
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  topic?: string;
  messages: ChatMessage[];
}

// Initial Synchronized Real Database State
export const initialUsers: UserProfile[] = [
  {
    id: 'usr-srdelorean',
    name: 'SrDeLorean',
    email: 'srdelorean@tournamentspro.com',
    gamertag: 'SrDeLorean',
    role: 'Jugador',
    primaryGame: 'eafc26',
    platform: 'PS5',
    position: 'MCO',
    rankBadge: 'División 1',
    status: 'Buscando Club',
    rating: '9.8',
    avatarUrl: '/uploads/usuarios/0ANkDShbpFOHqdj7b6bg_1783718412.webp',
  },
  {
    id: 'usr-pancho',
    name: 'Pancho_T10',
    email: 'pancho@tournamentspro.com',
    gamertag: 'Pancho_T10',
    role: 'Capitán',
    primaryGame: 'eafc26',
    platform: 'CROSSPLAY',
    position: 'DC',
    teamId: 'team-leguayork',
    teamName: 'LeguaYork eSp',
    rankBadge: 'Capitán Verificado',
    status: 'En Escuadra',
    rating: '9.6',
    avatarUrl: '/uploads/usuarios/1Zkhgan1DNOdEdM5S9y6_1783873006.webp',
  },
  {
    id: 'usr-caxorro',
    name: 'Caxorro_SN',
    email: 'caxorro@tournamentspro.com',
    gamertag: 'Caxorro_SN',
    role: 'Capitán',
    primaryGame: 'eafc26',
    platform: 'CROSSPLAY',
    position: 'DFC',
    teamId: 'team-sangre-nueva',
    teamName: 'Sangre Nueva FC',
    rankBadge: 'Líder Defensivo',
    status: 'En Escuadra',
    rating: '9.4',
    avatarUrl: '/uploads/usuarios/1kESBsJoBK8nXJqamQ9e_1787015541.webp',
  },
  {
    id: 'usr-vhaex',
    name: 'Vhaex_Pro',
    email: 'vhaex@tournamentspro.com',
    gamertag: 'Vhaex_Pro',
    role: 'Jugador',
    primaryGame: 'eafc26',
    platform: 'PC',
    position: 'MCD',
    rankBadge: 'Élite',
    status: 'Agencia Libre',
    rating: '9.2',
    avatarUrl: '/uploads/usuarios/2ha5lrCfeFMXP7uE7xsP_1783894425.webp',
  },
  {
    id: 'usr-fallen',
    name: 'Gabriel FalleN',
    email: 'fallen@tournamentspro.com',
    gamertag: 'FalleN_N1',
    role: 'Capitán',
    primaryGame: 'csgo',
    platform: 'PC',
    position: 'AWPer / IGL',
    rankBadge: 'Major Legend',
    status: 'Capitán',
    rating: '9.9',
    avatarUrl: '/uploads/usuarios/4EWg1Uv9sVCtjh10zoT8_1787620542.webp',
  },
  {
    id: 'usr-keznit',
    name: 'Angelo Keznit',
    email: 'keznit@tournamentspro.com',
    gamertag: 'Keznit_God',
    role: 'Jugador',
    primaryGame: 'valorant',
    platform: 'PC',
    position: 'Duelista',
    rankBadge: 'Radiant Top 1',
    status: 'Atleta Pro',
    rating: '9.9',
    avatarUrl: '/uploads/usuarios/5KujJ3pjd4sKpx92vZdB_1786079232.webp',
  },
  {
    id: 'usr-seiya',
    name: 'Edgar Seiya',
    email: 'seiya@tournamentspro.com',
    gamertag: 'Seiya_LoL',
    role: 'Jugador',
    primaryGame: 'lol',
    platform: 'PC',
    position: 'MID',
    rankBadge: 'Challenger',
    status: 'Atleta Pro',
    rating: '9.7',
    avatarUrl: '/uploads/usuarios/6qHrAa9yrSwwEp7iOzve_1784130334.webp',
  },
  {
    id: 'usr-yanxnz',
    name: 'Yan Yanxnz',
    email: 'yanxnz@tournamentspro.com',
    gamertag: 'Yanxnz_SSL',
    role: 'Jugador',
    primaryGame: 'rocketleague',
    platform: 'PC',
    position: 'Striker',
    rankBadge: 'Supersonic Legend',
    status: 'Atleta Pro',
    rating: '9.8',
    avatarUrl: '/uploads/usuarios/9NUM4gqeO7e7eHY8EmbS_1786482401.webp',
  },
  {
    id: 'usr-admin',
    name: 'Administrador Principal',
    email: 'admin@tournamentspro.com',
    gamertag: 'Admin_Pro',
    role: 'Administrador',
    primaryGame: 'eafc26',
    platform: 'CROSSPLAY',
    position: 'ADMINISTRADOR',
    rankBadge: 'Administrador General',
    status: 'Organizador',
    rating: '10.0',
    avatarUrl: '/uploads/usuarios/default-user.png',
  },
];

export const initialTeams: TeamData[] = [
  {
    id: 'team-leguayork',
    name: 'LeguaYork eSp',
    tag: 'LYE',
    gameSlug: 'eafc26',
    captainId: 'usr-pancho',
    captainName: 'Pancho_T10',
    membersCount: 45,
    maxMembers: 45,
    description: 'Escuadra competitiva e-sports oficial inscrita en los circuitos de Torneos Pro FC.',
    bannerUrl: '/images/games-background/eafc.jpg',
    logoUrl: '/uploads/equipos/vBHIgHcKxYAGa7eySYtQ_1786465550.webp',
    logoText: 'LY',
    platform: 'CROSSPLAY',
    status: 'ACTIVO',
    disputando: 'Liga Div 1',
    palmares: '3 Títulos',
    color: '#00F0FF',
    vacantPositions: ['MCD', 'LI'],
    members: [],
  },
  {
    id: 'team-sangre-nueva',
    name: 'Sangre Nueva FC',
    tag: 'SN FC',
    gameSlug: 'eafc26',
    captainId: 'usr-caxorro',
    captainName: 'Caxorro_SN',
    membersCount: 21,
    maxMembers: 45,
    description: 'Sangre Nueva FC nace el 16 de julio de 2022 con una idea clara: construir algo distinto. No solo un equipo, sino una identidad.',
    bannerUrl: '/uploads/equipos/YYBIw10vcqS2QfF9QWVN_1784584698.webp',
    logoUrl: '/uploads/equipos/TcJRrKKYMU0AQcfmRnXN_1784583945.webp',
    logoText: 'SN',
    platform: 'CROSSPLAY',
    status: 'ACTIVO',
    disputando: 'Copa Apertura',
    palmares: '1 Título',
    color: '#EF4444',
    vacantPositions: ['DC', 'ED'],
    members: [],
  },
  {
    id: 'team-san-lorenzo',
    name: 'San Lorenzo eSp',
    tag: 'SLE',
    gameSlug: 'eafc26',
    captainId: 'usr-srdelorean',
    captainName: 'SrDeLorean',
    membersCount: 32,
    maxMembers: 45,
    description: 'Club histórico con amplia trayectoria en torneos internacionales de Clubes Pro y eSports.',
    bannerUrl: '/uploads/equipos/0hCeAuWMmz2WfCVdejcC_1783646086.webp',
    logoUrl: '/uploads/equipos/5DFT7ABBa43ofW3rww0L_1783646061.webp',
    logoText: 'SL',
    platform: 'CROSSPLAY',
    status: 'ACTIVO',
    disputando: 'Liga Div 1',
    palmares: '5 Títulos',
    color: '#10B981',
    vacantPositions: ['POR', 'DFC'],
    members: [],
  },
  {
    id: 'team-papayeros',
    name: 'PAPAYEROS RISING',
    tag: 'RSG',
    gameSlug: 'eafc26',
    captainId: 'usr-organizer',
    captainName: 'Papayero_Cap',
    membersCount: 22,
    maxMembers: 45,
    description: 'Escuadra representativa del norte chileno con gran disciplina táctica.',
    bannerUrl: '/images/games-background/eafc.jpg',
    logoUrl: '/uploads/equipos/FQDibIpHE2a9IYU0DGGd_1784852582.webp',
    logoText: 'RSG',
    platform: 'CROSSPLAY',
    status: 'ACTIVO',
    disputando: 'Liga Div 1',
    palmares: '2 Títulos',
    color: '#FBBF24',
    vacantPositions: ['MCO'],
    members: [],
  },
  {
    id: 'team-bsk-esports',
    name: 'BSK ESPORTS',
    tag: 'BSK',
    gameSlug: 'eafc26',
    captainId: 'usr-organizer',
    captainName: 'Lucas_BSK',
    membersCount: 28,
    maxMembers: 45,
    description: 'Club competitivo de alta competencia en torneos Sudamericanos.',
    bannerUrl: '/images/games-background/eafc.jpg',
    logoUrl: '/uploads/equipos/WhpHJ3BY3t4c1b4CKq64_1783646037.webp',
    logoText: 'BSK',
    platform: 'CROSSPLAY',
    status: 'ACTIVO',
    disputando: 'Liga Div 1',
    palmares: '4 Títulos',
    color: '#A855F7',
    vacantPositions: [],
    members: [],
  },
  {
    id: 'team-audax-esports',
    name: 'Audax Esports',
    tag: 'AUD',
    gameSlug: 'eafc26',
    captainId: 'usr-organizer',
    captainName: 'Matias_AUD',
    membersCount: 26,
    maxMembers: 45,
    description: 'Rama de deportes electrónicos del histórico club itálico.',
    bannerUrl: '/images/games-background/eafc.jpg',
    logoUrl: '/uploads/equipos/Khr6no1kZ2HzUcyLYwyT_1783646344.webp',
    logoText: 'AUD',
    platform: 'CROSSPLAY',
    status: 'ACTIVO',
    disputando: 'Liga Div 1',
    palmares: '1 Título',
    color: '#059669',
    vacantPositions: ['MCD'],
    members: [],
  },
];

export const initialTransfers: TransferListing[] = [];

export const initialConversations: Conversation[] = [];

// Multi-Tournament Roster Registrations Database
export const initialTournamentRosters: TournamentRosterEntry[] = [];

// Helper: Check if team name is available in a specific game discipline
export function checkTeamNameAvailability(name: string, gameSlug: string): boolean {
  if (!name || !name.trim()) return false;
  const normalized = name.trim().toLowerCase();
  return !initialTeams.some(
    (t) => t.gameSlug === gameSlug && t.name.trim().toLowerCase() === normalized
  );
}
