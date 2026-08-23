const mysql = require('mysql2/promise');

async function seed16TeamsAndUsersComplete() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tournamentspro',
  });

  console.log('🚀 Iniciando inserción masiva de 16 Capitanes/Usuarios y 16 Equipos eSports...\n');

  const teamsData = [
    { name: 'Apex Predators eSports', tag: 'APX', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200', captain: 'Alex Mercer', gamertag: 'ViperAPX' },
    { name: 'Cyber Titans', tag: 'CYB', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200', captain: 'Carlos Rossi', gamertag: 'ShadowCYB' },
    { name: 'Neon Warriors Club', tag: 'NWC', logo: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200', captain: 'David Silva', gamertag: 'PhantasmNWC' },
    { name: 'Quantum Esport Gaming', tag: 'QEG', logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200', captain: 'Eduardo Gomez', gamertag: 'PulseQEG' },
    { name: 'Vortex Gaming FC', tag: 'VGFC', logo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=200', captain: 'Fernando Morales', gamertag: 'BlazeVGFC' },
    { name: 'Inferno Squad eSports', tag: 'INF', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200', captain: 'Gabriel Torres', gamertag: 'RaptorINF' },
    { name: 'Solaris Gaming Club', tag: 'SGC', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200', captain: 'Hugo Mendoza', gamertag: 'AstraSGC' },
    { name: 'Astral Valkyries', tag: 'AVK', logo: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200', captain: 'Ignacio Vega', gamertag: 'SpectreAVK' },
    { name: 'Gladiator eSports', tag: 'GLD', logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200', captain: 'Javier Rios', gamertag: 'SpartanGLD' },
    { name: 'Krypton eSports', tag: 'KRY', logo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=200', captain: 'Luis Vargas', gamertag: 'NovaKRY' },
    { name: 'Obsidian Gaming', tag: 'OBS', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200', captain: 'Manuel Castro', gamertag: 'ZeroOBS' },
    { name: 'Phantom Syndicate', tag: 'PHN', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200', captain: 'Nicolás Rivas', gamertag: 'GhostPHN' },
    { name: 'Velocity eSports', tag: 'VEL', logo: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200', captain: 'Oscar Delgado', gamertag: 'NitroVEL' },
    { name: 'Zenith Gaming Club', tag: 'ZGC', logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200', captain: 'Pablo Ortega', gamertag: 'ApexZGC' },
    { name: 'Ragnarok eSports', tag: 'RGK', logo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=200', captain: 'Roberto Navarro', gamertag: 'ThorRGK' },
    { name: 'Titanium Squad', tag: 'TTS', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200', captain: 'Sergio Fuentes', gamertag: 'IronTTS' },
  ];

  const summary = [];

  for (let i = 0; i < teamsData.length; i++) {
    const item = teamsData[i];
    const userId = `usr-cap-gen-${100 + i + 1}`;
    const teamId = `team-gen-${100 + i + 1}`;
    const email = `capitan.${item.tag.toLowerCase()}@tournamentspro.esports`;

    // 1. Insertar Usuario Capitan (con gamertag obligatorio)
    await connection.query(
      `INSERT INTO users (id, name, email, gamertag, role, primary_game_slug, platform, position, status)
       VALUES (?, ?, ?, ?, 'Capitan', 'eafc26', 'CROSSPLAY', 'DC', 'Activo')
       ON DUPLICATE KEY UPDATE name = VALUES(name), gamertag = VALUES(gamertag), role = VALUES(role)`,
      [userId, item.captain, email, item.gamertag]
    );

    // 2. Insertar Equipo (con captain_id y captain_name obligatorios)
    await connection.query(
      `INSERT INTO teams (id, name, tag, logo_url, captain_id, captain_name, platform, game_slug, status)
       VALUES (?, ?, ?, ?, ?, ?, 'CROSSPLAY', 'eafc26', 'Activo')
       ON DUPLICATE KEY UPDATE name = VALUES(name), tag = VALUES(tag), logo_url = VALUES(logo_url), captain_id = VALUES(captain_id), captain_name = VALUES(captain_name)`,
      [teamId, item.name, item.tag, item.logo, userId, item.captain]
    );

    summary.push({
      "#": i + 1,
      ID_Equipo: teamId,
      Nombre_Equipo: item.name,
      TAG: item.tag,
      Capitan_Responsable: item.captain,
      Gamertag: item.gamertag,
      ID_Capitan: userId,
      Email: email,
    });
  }

  await connection.end();

  console.log(`✅ ¡Se han generado y guardado exitosamente ${summary.length} equipos eSports con sus 16 usuarios capitanes en MySQL!`);
  console.table(summary);
}

seed16TeamsAndUsersComplete().catch(console.error);
