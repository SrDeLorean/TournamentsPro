import { queryDB, executeCommand, withTransaction } from '@/lib/db';
import { UserRepository } from './user.repository';
import { OrganizationRepository } from './organization.repository';
import { TeamRepository } from './team.repository';
import { CompetitionRepository } from './competition.repository';
import { SeasonRepository } from './season.repository';
import { MatchRepository } from './match.repository';
import { GameRepository } from './game.repository';
import type { IDatabaseProvider } from '../interfaces';
import type { ResultSetHeader } from 'mysql2';
import type { DatabaseExecutor, DatabaseParams } from '@/lib/db';

export class MysqlDatabaseProvider implements IDatabaseProvider {
  users: UserRepository;
  organizations: OrganizationRepository;
  teams: TeamRepository;
  competitions: CompetitionRepository;
  seasons: SeasonRepository;
  matches: MatchRepository;
  games: GameRepository;

  constructor(private executor?: DatabaseExecutor) {
    this.users = new UserRepository(executor);
    this.organizations = new OrganizationRepository(executor);
    this.teams = new TeamRepository(executor);
    this.competitions = new CompetitionRepository(executor);
    this.seasons = new SeasonRepository(executor);
    this.matches = new MatchRepository(executor);
    this.games = new GameRepository(executor);
  }

  async query<T = unknown>(sql: string, params: DatabaseParams = []): Promise<T[]> {
    if (this.executor) {
      return this.executor.queryRows<T>(sql, params) as Promise<T[]>;
    }
    return queryDB<T>(sql, params) as Promise<T[]>;
  }

  async execute(sql: string, params: DatabaseParams = []): Promise<ResultSetHeader> {
    if (this.executor) {
      return this.executor.executeCommand(sql, params);
    }
    return executeCommand(sql, params);
  }

  // Compatibility with compare-and-swap helpers that operate on a low-level
  // DatabaseExecutor while service code works with the provider abstraction.
  async executeCommand(sql: string, params: DatabaseParams = []): Promise<ResultSetHeader> {
    return this.execute(sql, params);
  }

  async withTransaction<T>(operation: (tx: IDatabaseProvider) => Promise<T>): Promise<T> {
    if (this.executor) {
      return operation(this);
    }
    return withTransaction(async (transactionExecutor) => {
      const txProvider = new MysqlDatabaseProvider(transactionExecutor);
      return operation(txProvider);
    });
  }
}

export const mysqlProvider = new MysqlDatabaseProvider();
