const mysql = require('mysql2/promise');

async function seed16TeamsAndUsersFixed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tournamentspro',
  });

  const [userCols] = await connection.query(`SHOW COLUMNS FROM users`);
  console.log('Columnas de `users`:', userCols.map(c => `${c.Field} (${c.Type}, Null: ${c.Null})`).join('\n'));

  const [teamCols] = await connection.query(`SHOW COLUMNS FROM teams`);
  console.log('Columnas de `teams`:', teamCols.map(c => `${c.Field} (${c.Type}, Null: ${c.Null})`).join('\n'));

  const eSportsTeamsData = [
    { name: 'Apex Predators eSports', tag: 'APX', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200', captain: 'Alex "Viper" Mercer' },
    { name: 'Cyber Titans', tag: 'CYB', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200', captain: 'Carlos "Shadow" Rossi' },
    { name: 'Neon Warriors Club', tag: 'NWC', logo: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200', captain: 'David "Phantasm" Silva' },
    { name: 'Quantum Esport Gaming', tag: 'QEG', logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200', captain: 'Eduardo "Pulse" Gomez' },
    { name: 'Vortex Gaming FC', tag: 'VGFC', logo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=200', captain: 'Fernando "Blaze" Morales' },
    { name: 'Inferno Squad eSports', tag: 'INF', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200', captain: 'Gabriel "Raptor" Torres' },
    { name: 'Solaris Gaming Club', tag: 'SGC', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200', captain: 'Hugo "Astra" Mendoza' },
    { name: 'Astral Valkyries', tag: 'AVK', logo: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200', captain: 'Ignacio "Spectre" Vega' },
    { name: 'Gladiator eSports', tag: 'GLD', logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200', captain: 'Javier "Spartan" Rios' },
    { name: 'Krypton eSports', tag: 'KRY', logo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=200', captain: 'Luis "Nova" Vargas' },
    { name: 'Obsidian Gaming', tag: 'OBS', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200', captain: 'Manuel "Zero" Castro' },
    { name: 'Phantom Syndicate', tag: 'PHN', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200', captain: 'Nicolás "Ghost" Rivas' },
    { name: 'Velocity eSports', tag: 'VEL', logo: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200', captain: 'Oscar "Nitro" Delgado' },
    { name: 'Zenith Gaming Club', tag: 'ZGC', logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200', captain: 'Pablo "Apex" Ortega' },
    { name: 'Ragnarok eSports', tag: 'RGK', logo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=200', captain: 'Roberto "Thor" Navarro' },
    { name: 'Titanium Squad', tag: 'TTS', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200', captain: 'Sergio "Iron" Fuentes' },
  ];

  const createdSummary = [];

  for (let i = 0; i < eSportsTeamsData.length; i++) {
    const item = eSportsTeamsData[i];
    const userId = `usr-captain-${100 + i + 1}`;
    const teamId = `team-esports-${100 + i + 1}`;
    const email = `capitan${i + 1}@tournamentspro.esports`;
    const cleanCaptainName = item.captain;

    // 1. Insertar Usuario Responsable
    await connection.query(
      `INSERT INTO users (id, name, email, role)
       VALUES (?, ?, ?, 'Organizador')
       ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), role = VALUES(role)`,
      [userId, cleanCaptainName, email]
    );

    // 2. Insertar Equipo eSports
    await connection.query(
      `INSERT INTO teams (id, name, tag, logo_url, captain_id, platform, game_slug)
       VALUES (?, ?, ?, ?, ?, 'CROSSPLAY', 'eafc26')
       ON DUPLICATE KEY UPDATE name = VALUES(name), tag = VALUES(tag), logo_url = VALUES(logo_url), captain_id = VALUES(captain_id)`,
      [teamId, item.name, item.tag, item.logo, userId]
    );

    createdSummary.push({
      "#": i + 1,
      ID_Equipo: teamId,
      Nombre_Equipo: item.name,
      TAG: item.tag,
      Capitan_Responsable: cleanCaptainName,
      ID_Usuario: userId,
      Email: email,
    });
  }

  await connection.end();

  console.log(`\n✅ ¡Se han generado exitosamente ${createdSummary.length} equipos con sus 16 usuarios responsables!`);
  console.table(createdSummary);
}

seed16TeamsAndUsersFixed().catch(console.error);
