const mysql = require('mysql2/promise');

async function createCompetitionsTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tournamentspro',
  });

  console.log('⚡ Conectado a MySQL. Creando tablas para el Módulo de Competencias...');

  // 1. Tabla de Competencias / Torneos
  await connection.query(`
    CREATE TABLE IF NOT EXISTS competitions (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      game_slug VARCHAR(50) NOT NULL,
      organizer_id VARCHAR(100) DEFAULT NULL,
      organizer_name VARCHAR(255) DEFAULT NULL,
      organization_id VARCHAR(100) DEFAULT NULL,
      mode_format VARCHAR(50) DEFAULT '11v11',
      status ENUM('Borrador', 'Activo', 'Finalizado', 'Deshabilitado') DEFAULT 'Borrador',
      fecha_inicio DATETIME NOT NULL,
      fecha_termino DATETIME DEFAULT NULL,
      description TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
  console.log('✓ Tabla `competitions` asegurada.');

  // 2. Tabla Intermedia de Inscripción de Equipos en Competencias
  await connection.query(`
    CREATE TABLE IF NOT EXISTS competition_teams (
      id VARCHAR(100) PRIMARY KEY,
      competition_id VARCHAR(100) NOT NULL,
      team_id VARCHAR(100) NOT NULL,
      team_name VARCHAR(255) NOT NULL,
      team_tag VARCHAR(10) DEFAULT NULL,
      enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status ENUM('INSCRITO', 'CONFIRMADO', 'RETIRADO') DEFAULT 'CONFIRMADO',
      UNIQUE KEY unique_competition_team (competition_id, team_id),
      FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
    );
  `);
  console.log('✓ Tabla `competition_teams` asegurada.');

  // 3. Modificar / Asegurar columna competition_id en `matches`
  try {
    await connection.query(`
      ALTER TABLE matches ADD COLUMN competition_id VARCHAR(100) DEFAULT NULL AFTER tournament_id;
    `);
    console.log('✓ Columna `competition_id` agregada a la tabla `matches`.');
  } catch (err) {
    if (!err.message.includes("Duplicate column name")) {
      console.warn('Nota sobre matches column:', err.message);
    }
  }

  // Insert mock competition if table is empty
  const [rows] = await connection.query('SELECT COUNT(*) as count FROM competitions');
  if (rows[0].count === 0) {
    await connection.query(`
      INSERT INTO competitions (id, name, game_slug, organizer_id, organizer_name, mode_format, status, fecha_inicio, description)
      VALUES 
        ('comp-eafc-liga-pro-2026', 'Liga Pro EA FC 26 Apertura', 'eafc26', 'usr-organizer', 'Organizador Oficial', '11v11', 'Activo', NOW(), 'Torneo oficial de Clubes Pro 11v11 primera división eSports.'),
        ('comp-val-champions-2026', 'Valorant Master Champions', 'valorant', 'usr-organizer', 'Organizador Oficial', '5v5', 'Activo', NOW(), 'Campeonato táctico 5v5 al mejor de 24 rondas.');
    `);
    console.log('✓ Se insertaron competencias iniciales de prueba.');
  }

  await connection.end();
  console.log('🚀 Tablas creadas e inicializadas exitosamente.');
}

createCompetitionsTables().catch(console.error);
