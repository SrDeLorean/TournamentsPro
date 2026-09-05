// =============================================================================
// TournamentsPro — MySQL Database Repositories Barrel Index
// =============================================================================

export * from './types';
export * from './user.repository';
export * from './organization.repository';
export * from './team.repository';
export * from './competition.repository';
export * from './season.repository';
export * from './match.repository';
export * from './game.repository';
export * from './provider';

import { UserRepository } from './user.repository';
import { OrganizationRepository } from './organization.repository';
import { TeamRepository } from './team.repository';
import { CompetitionRepository } from './competition.repository';
import { SeasonRepository } from './season.repository';
import { MatchRepository } from './match.repository';
import { GameRepository } from './game.repository';

export const userRepository = new UserRepository();
export const organizationRepository = new OrganizationRepository();
export const teamRepository = new TeamRepository();
export const competitionRepository = new CompetitionRepository();
export const seasonRepository = new SeasonRepository();
export const matchRepository = new MatchRepository();
export const gameRepository = new GameRepository();
