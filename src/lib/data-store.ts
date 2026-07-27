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
    position: 'DC',
    rankBadge: 'División 1',
    status: 'Buscando Club',
    rating: '9.5',
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
  },
  {
    id: 'usr-organizer',
    name: 'Organizador Oficial',
    email: 'organizador@tournamentspro.com',
    gamertag: 'Organizador_Pro',
    role: 'Organizador',
    primaryGame: 'eafc26',
    platform: 'CROSSPLAY',
    position: 'ORGANIZADOR',
    rankBadge: 'Organizador Verificado',
    status: 'Organizador',
    rating: '10.0',
  },
];

export const initialTeams: TeamData[] = [];

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
