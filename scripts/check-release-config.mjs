import { pathToFileURL } from 'node:url';

const PLACEHOLDER = /replace|placeholder|change.in.production|missing.service.role.key|^test$|^example$/i;

export function inspectReleaseConfig(env) {
  const errors = [];
  const provider = (env.DATABASE_PROVIDER || '').toLowerCase();
  const secret = env.JWT_SECRET || env.NEXTAUTH_SECRET || '';

  if (provider !== 'mysql' && provider !== 'supabase') {
    errors.push('DATABASE_PROVIDER debe ser mysql o supabase de forma explícita.');
  }
  if (secret.length < 32 || PLACEHOLDER.test(secret)) {
    errors.push('JWT_SECRET debe contener al menos 32 caracteres y no ser un valor de ejemplo.');
  }

  if (provider === 'supabase') {
    errors.push('Supabase aún no es apto para producción: las operaciones de negocio que requieren transacciones atómicas deben migrarse a RPC o a un proveedor transaccional.');
    const rawUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '';
    let validUrl = false;
    try {
      const url = new URL(rawUrl);
      validUrl = url.protocol === 'https:' && Boolean(url.hostname) && !url.hostname.includes('placeholder');
    } catch {
      // A missing or malformed URL is reported without printing its value.
    }
    if (!validUrl) errors.push('SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL debe ser una URL HTTPS válida.');
    if (!env.SUPABASE_SERVICE_ROLE_KEY || PLACEHOLDER.test(env.SUPABASE_SERVICE_ROLE_KEY)) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY debe configurarse solo en el servidor.');
    }
    if (env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
      errors.push('La clave service_role nunca debe utilizar el prefijo NEXT_PUBLIC_.');
    }
    if (env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY === env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      errors.push('La clave service_role no puede ser igual a la clave pública anon.');
    }
  }

  if (provider === 'mysql') {
    for (const name of ['DB_HOST', 'DB_USER', 'DB_NAME']) {
      if (!env[name]) errors.push(`${name} es obligatorio para MySQL.`);
    }
    if (!env.DB_PASSWORD || PLACEHOLDER.test(env.DB_PASSWORD)) {
      errors.push('DB_PASSWORD debe configurarse con un valor privado para MySQL de producción.');
    }
  }

  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = inspectReleaseConfig(process.env);
  if (errors.length > 0) {
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log('Configuración local de lanzamiento: válida. No se ha conectado a la base de datos.');
  }
}
