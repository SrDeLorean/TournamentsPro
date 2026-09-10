import type { IDatabaseProvider } from '../interfaces';
import { 
  SupabaseUserRepository, 
  SupabaseOrganizationRepository, 
  SupabaseTeamRepository, 
  SupabaseCompetitionRepository, 
  SupabaseSeasonRepository,
  SupabaseMatchRepository,
  SupabaseGameRepository,
  SupabaseNotificationRepository
} from './implementations';

export class SupabaseDatabaseProvider implements IDatabaseProvider {
  users = new SupabaseUserRepository();
  organizations = new SupabaseOrganizationRepository();
  teams = new SupabaseTeamRepository();
  competitions = new SupabaseCompetitionRepository();
  seasons = new SupabaseSeasonRepository();
  matches = new SupabaseMatchRepository();
  games = new SupabaseGameRepository();
  notifications = new SupabaseNotificationRepository();

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    throw new Error('Las consultas SQL directas (queryDB) no están soportadas en Supabase REST. Debes usar los repositorios de dbProvider.');
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    throw new Error('La ejecución SQL directa (executeCommand) no está soportada en Supabase REST. Debes usar los repositorios de dbProvider.');
  }

  async withTransaction<T>(operation: (tx: IDatabaseProvider) => Promise<T>): Promise<T> {
    return operation(this);
  }
}

export const supabaseProvider = new SupabaseDatabaseProvider();
