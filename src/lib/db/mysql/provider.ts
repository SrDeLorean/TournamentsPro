// @ts-nocheck
import { queryDB, executeCommand, withTransaction } from '@/lib/db';
import { 
  UserRepository, 
  OrganizationRepository, 
  TeamRepository, 
  CompetitionRepository, 
  SeasonRepository 
} from '@/lib/repositories';
import type { IDatabaseProvider } from '../interfaces';
import type { DatabaseExecutor } from '@/lib/db';

export class MysqlDatabaseProvider implements IDatabaseProvider {
  users = new UserRepository();
  organizations = new OrganizationRepository();
  teams = new TeamRepository();
  competitions = new CompetitionRepository();
  seasons = new SeasonRepository();
  matches = new MatchRepository();

  constructor(private executor?: DatabaseExecutor) {}

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (this.executor) {
      return this.executor.queryRows<T>(sql, params) as Promise<T[]>;
    }
    return queryDB<T>(sql, params) as Promise<T[]>;
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    if (this.executor) {
      return this.executor.executeCommand(sql, params);
    }
    return executeCommand(sql, params);
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
