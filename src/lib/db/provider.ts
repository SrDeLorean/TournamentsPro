import type { IDatabaseProvider } from './interfaces';
import { mysqlProvider } from './mysql/provider';
import { supabaseProvider } from './supabase/provider';

// Obtenemos el proveedor configurado desde las variables de entorno.
// Por defecto usaremos mysql para no romper el sistema existente.
const providerType = process.env.DATABASE_PROVIDER || 'mysql';

let activeProvider: IDatabaseProvider;

if (providerType === 'supabase') {
  activeProvider = supabaseProvider;
} else {
  activeProvider = mysqlProvider;
}

export const dbProvider = activeProvider;

// Exportamos alias para hacer el refactoring más fácil y gradual
export const queryDB = activeProvider.query.bind(activeProvider);
export const executeCommand = activeProvider.execute.bind(activeProvider);
export const withTransaction = activeProvider.withTransaction.bind(activeProvider);
