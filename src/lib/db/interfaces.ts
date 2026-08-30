export interface FindOptions {
  where?: Record<string, unknown>;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: FindOptions): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(options?: FindOptions): Promise<number>;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  name: string;
  gamertag: string;
  role: string;
  primaryGameSlug: string;
  platform: string;
  position: string;
  secondaryPosition: string | null;
  rankBadge: string;
  rating: number;
  status: string;
  avatarUrl: string | null;
  foto?: string | null;
  bannerUrl?: string | null;
  biografia?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  twitch?: string | null;
  discord?: string | null;
  youtube?: string | null;
  whatsapp?: string | null;
  organizationId: string | null;
  isBanned: boolean;
  banReason: string | null;
  bannedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface Organization {
  isBanned?: boolean;
  banReason?: string | null;
  bannedAt?: string | null;
  socialMedia?: Record<string, unknown> | null;
  status?: string;
  slug?: string;
  foundedYear?: string | null;
  id: string;
  name: string;
  tag: string;
  ownerId: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  country: string;
  allowedGames: string[];
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  gameSlug: string;
  organizationId: string | null;
  captainId: string;
  captainName: string;
  platform: string;
  membersCount: number;
  maxMembers: number;
  color: string;
  logoText: string;
  description: string | null;
  vacantPositions: string[];
  logoUrl: string | null;
  bannerUrl: string | null;
  status: string;
  clubIdEa: string | null;
  isBanned?: boolean;
  banReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Competition {
  id: string;
  name: string;
  gameSlug: string;
  organizerId: string | null;
  organizerName: string | null;
  organizationId: string | null;
  seasonId: string | null;
  prizePool: string | null;
  transferMarketMode: string;
  modeFormat: string;
  status: string;
  fechaLimiteInscripcion: string | null;
  fechaInicio: string;
  fechaTermino: string | null;
  description: string | null;
  createdAt: string;
}

export interface Season {
  id: string;
  name: string;
  organizationId: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  createdAt: string;
}

export interface Game {
  slug: string;
  name: string;
  category: string;
  teamSize: number;
  positionsJson: any | null;
  brandColor: string;
  statsSchema: any | null;
  createdAt: string;
}

export interface IUserRepository extends IRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findByGamertag(gamertag: string): Promise<User | null>;
  findByEmailOrGamertag(identifier: string): Promise<User | null>;
}

export interface IOrganizationRepository extends IRepository<Organization> {
  findByOwnerId(ownerId: string): Promise<Organization | null>;
  getOrganizationsWithStats(gameSlug?: string): Promise<any[]>;
}

export interface ITeamRepository extends IRepository<Team> {
  findByCaptain(captainId: string, gameSlug?: string): Promise<Team[]>;
  findByOrganization(orgId: string): Promise<Team[]>;
  findByGameSlug(gameSlug: string): Promise<Team[]>;
  updateMembersCount(teamId: string): Promise<void>;
  getManagers(teamId: string): Promise<string[]>;
}

export interface ICompetitionRepository extends IRepository<Competition> {
  findByOrganizer(organizerId: string): Promise<Competition[]>;
  findByOrganization(orgId: string): Promise<Competition[]>;
  findByGameSlug(gameSlug: string): Promise<Competition[]>;
  getEnrolledTeams(competitionId: string): Promise<any[]>;
  removeEnrolledTeam(competitionId: string, teamId: string): Promise<void>;
  getReportedMatchesCount(competitionId: string): Promise<number>;
  getMatchCompetitionId(matchId: string): Promise<string | null>;
  upsertCompetitionTeam(enrollId: string, competitionId: string, teamId: string, teamName: string, teamTag: string | null): Promise<void>;
}

export interface ISeasonRepository extends IRepository<Season> {
  findByOrganization(orgId: string): Promise<Season[]>;
}

export interface Match {
  createdAt?: string;
  id: string;
  tournamentId: string | null;
  competitionId: string | null;
  round: number | null;
  matchday: number | null;
  roundName: string | null;
  groupName: string | null;
  teamHomeId: string | null;
  homeTeamId: string | null;
  teamAwayId: string | null;
  awayTeamId: string | null;
  homeTeamName: string | null;
  homeTeamTag: string | null;
  awayTeamName: string | null;
  awayTeamTag: string | null;
  scoreHome: number | null;
  scoreAway: number | null;
  reportedScoreHome: number | null;
  reportedScoreAway: number | null;
  winnerTeamId: string | null;
  proofUrl: string | null;
  reportedByUserId: string | null;
  nextMatchId: string | null;
  nextMatchSlot: string | null;
  scheduledAt: string | null;
  scheduledTime: string | null;
  status: string;
}

export interface IMatchRepository extends IRepository<Match> {
  findByCompetition(competitionId: string): Promise<Match[]>;
  addPlayerStat(statsId: string, matchId: string, playerId: string, gameSlug: string, statsJson: string): Promise<void>;
}

export interface IGameRepository extends IRepository<Game> {}

export interface IDatabaseProvider {
  users: IUserRepository;
  organizations: IOrganizationRepository;
  teams: ITeamRepository;
  competitions: ICompetitionRepository;
  seasons: ISeasonRepository;
  matches: IMatchRepository;
  games: IGameRepository;

  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<any>;
  withTransaction<T>(operation: (tx: IDatabaseProvider) => Promise<T>): Promise<T>;
}
