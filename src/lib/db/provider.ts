import type { IDatabaseProvider } from './interfaces';

const providerType = (process.env.DATABASE_PROVIDER || 'mysql').toLowerCase();

// Import only the configured adapter. A static Supabase import initializes its
// client immediately and throws when a MySQL deployment has no Supabase keys.
const activeProvider: IDatabaseProvider = providerType === 'supabase'
  ? (await import('./supabase/provider')).supabaseProvider
  : (await import('./mysql/provider')).mysqlProvider;

export const dbProvider = activeProvider;

// Exportamos alias para hacer el refactoring más fácil y gradual
export const queryDB = activeProvider.query.bind(activeProvider);
export const executeCommand = activeProvider.execute.bind(activeProvider);
export const withTransaction = activeProvider.withTransaction.bind(activeProvider);
