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

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    void sql;
    void params;
    throw new Error('Las consultas SQL directas (queryDB) no están soportadas en Supabase REST. Debes usar los repositorios de dbProvider.');
  }

  async execute(sql: string, params: unknown[] = []): Promise<never> {
    void sql;
    void params;
    throw new Error('La ejecución SQL directa (executeCommand) no está soportada en Supabase REST. Debes usar los repositorios de dbProvider.');
  }

  async withTransaction<T>(operation: (tx: IDatabaseProvider) => Promise<T>): Promise<T> {
    // Para Supabase REST, emulamos la transacción inyectando el mismo provider.
    // PostgREST ejecuta cada operación vía HTTP REST.
    return operation(this);
  }
}

export const supabaseProvider = new SupabaseDatabaseProvider();
