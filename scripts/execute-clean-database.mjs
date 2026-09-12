import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8') + '\n' + (fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '');
const getEnv = (k) => {
  const m = envContent.match(new RegExp('^' + k + '=(.*)$', 'm'));
  return m ? m[1].trim() : '';
};

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!url || !key) {
  console.error('Faltan credenciales de Supabase.');
  process.exit(1);
}

const supabase = createClient(url, key);

async function deleteAll(table, idCol = 'id') {
  console.log(`Vaciando tabla ${table}...`);
  try {
    const { error } = await supabase.from(table).delete().neq(idCol, '___placeholder_safe___');
    if (error) {
      console.warn(`Advertencia en ${table}:`, error.message);
    } else {
      console.log(`Tabla ${table} vaciada con éxito.`);
    }
  } catch (e) {
    console.warn(`Excepción en ${table}:`, e.message);
  }
}

async function run() {
  console.log('=== INICIANDO PURGA CONTROLADA DE BASE DE DATOS ===');
  console.log('Destino Supabase URL:', url);

  // 1. Romper ciclo referencial: Quitar organization_id de todos los usuarios
  console.log('Desvinculando organization_id de usuarios...');
  const { error: unlinkErr } = await supabase
    .from('users')
    .update({ organization_id: null })
    .neq('id', '___placeholder___');

  if (unlinkErr) {
    console.warn('Error al desvincular organization_id:', unlinkErr.message);
  } else {
    console.log('Usuarios desvinculados de organizaciones.');
  }

  // 2. Limpiar mensajes y chats
  await deleteAll('chat_messages', 'id');
  await deleteAll('chat_typing_status', 'thread_id');
  await deleteAll('chat_threads', 'id');

  // 3. Limpiar estadísticas y reportes de partidos
  await deleteAll('match_player_stats', 'id');
  await deleteAll('match_reports', 'id');
  await deleteAll('matches', 'id');

  // 4. Limpiar inscripciones y competencias
  await deleteAll('tournament_rosters', 'id');
  await deleteAll('competition_teams', 'id');
  await deleteAll('transfer_windows', 'id');
  await deleteAll('competitions', 'id');
  await deleteAll('seasons', 'id');

  // 5. Limpiar mercado y postulaciones
  await deleteAll('transfer_market_posts', 'id');
  await deleteAll('transfer_offers', 'id');
  await deleteAll('transfer_applications', 'id');
  await deleteAll('transfer_history_logs', 'id');

  // 6. Limpiar plantillas y equipos
  await deleteAll('team_vacancies', 'id');
  await deleteAll('team_members', 'id');
  await deleteAll('teams', 'id');

  // 7. Limpiar organizaciones
  await deleteAll('organizations', 'id');

  // 8. Limpiar notificaciones y sesiones
  await deleteAll('notifications', 'id');
  await deleteAll('auth_sessions', 'session_id');
  await deleteAll('security_rate_limits', 'rate_key');
  await deleteAll('security_audit_log', 'id');

  // 9. Limpiar usuarios regulares conservando el Administrador principal
  console.log('Eliminando usuarios regulares...');
  const { error: userDelErr } = await supabase.from('users').delete().neq('id', 'admin-1');
  if (userDelErr) {
    console.warn('Error al eliminar usuarios:', userDelErr.message);
  } else {
    console.log('Usuarios eliminados (conservado admin-1).');
  }

  // Restaurar canales del sistema por defecto
  console.log('Recreando canales oficiales del sistema...');
  const defaultThreads = [
    {
      id: 'ct-admin-broadcast',
      channel_type: 'ANUNCIO_ADMIN',
      game_slug: 'eafc26',
      title: 'Anuncios Globales de Administración',
      participant_a_id: 'admin-1',
      participant_a_name: 'Administrador Principal',
      participant_a_role: 'Administrador',
      participant_b_id: 'usr-all',
      participant_b_name: 'Comunidad eSports',
      participant_b_role: 'Jugador',
      last_message_text: 'Canal oficial de boletines, comunicados de sanciones y actualizaciones del sistema.'
    },
    {
      id: 'ct-org-support',
      channel_type: 'SOPORTE_ORGANIZADOR',
      game_slug: 'eafc26',
      title: 'Canal Oficial de Organizadores & Arbitraje',
      participant_a_id: 'admin-1',
      participant_a_name: 'Administrador Principal',
      participant_a_role: 'Administrador',
      participant_b_id: 'usr-all',
      participant_b_name: 'Comunidad eSports',
      participant_b_role: 'Jugador',
      last_message_text: 'Mesa de ayuda directa habilitada para consultas de torneo y reporte de partidos.'
    }
  ];
  await supabase.from('chat_threads').upsert(defaultThreads);

  console.log('\n=== AUDITORÍA POST-LIMPIEZA ===');
  const tables = [
    'users',
    'organizations',
    'teams',
    'team_members',
    'competitions',
    'competition_teams',
    'matches',
    'seasons',
    'chat_threads',
    'chat_messages',
    'auth_sessions',
    'games'
  ];

  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`Post-limpieza ${t}: ${error ? error.message : count + ' filas'}`);
  }

  console.log('\n=== PURGA COMPLETADA CON ÉXITO ===');
}

run().catch(console.error);
