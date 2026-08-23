const mysql = require('mysql2/promise');

async function seedTeamsAndCaptains() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'tournamentspro',
    waitForConnections: true,
    connectionLimit: 5,
  });

  console.log('🌱 Poblando 48 Equipos (16 EA FC 26, 16 Valorant, 16 League of Legends) y sus Capitanes en MySQL...');

  // 1. Datos para EA FC 26 (16 Equipos)
  const eafcTeams = [
    { name: 'Apex Predators eSports', tag: 'APX', color: '#00F0FF', position: 'DC', captainName: 'Alex Mercer', gamertag: 'ApexViper' },
    { name: 'Cyber Titans FC', tag: 'CYB', color: '#38BDF8', position: 'MCO', captainName: 'Carlos Rossi', gamertag: 'TitanRossi' },
    { name: 'Astral Valkyries FC', tag: 'AVK', color: '#F43F5E', position: 'DFC', captainName: 'Valeria Silva', gamertag: 'Valkyria01' },
    { name: 'Kuroshiro Gaming', tag: 'KSG', color: '#A855F7', position: 'MC', captainName: 'Kenji Sato', gamertag: 'KuroKenji' },
    { name: 'Vanguard eSports FC', tag: 'VGD', color: '#EAB308', position: 'POR', captainName: 'Lucas Morales', gamertag: 'VanguardWall' },
    { name: 'Nova Syndicate FC', tag: 'NVS', color: '#10B981', position: 'EI', captainName: 'Mateo Fernández', gamertag: 'NovaStriker' },
    { name: 'Titanium Gaming FC', tag: 'TTN', color: '#64748B', position: 'ED', captainName: 'Gabriel Torres', gamertag: 'TitanSpeed' },
    { name: 'Starlight eSports FC', tag: 'STL', color: '#EC4899', position: 'MCD', captainName: 'Sofia Castillo', gamertag: 'StarlightCap' },
    { name: 'Obsidian Legion FC', tag: 'OBS', color: '#8B5CF6', position: 'LD', captainName: 'Diego Mendoza', gamertag: 'ObsidianTank' },
    { name: 'Solaris Gaming FC', tag: 'SLR', color: '#F97316', position: 'LI', captainName: 'Santiago Navarro', gamertag: 'SolarisRay' },
    { name: 'Vortex eSports FC', tag: 'VTX', color: '#06B6D4', position: 'DFC', captainName: 'Felipe Herrera', gamertag: 'VortexShield' },
    { name: 'Zenith eSports FC', tag: 'ZNT', color: '#84CC16', position: 'DC', captainName: 'Ignacio Vega', gamertag: 'ZenithGoal' },
    { name: 'Ignite Gaming FC', tag: 'IGN', color: '#EF4444', position: 'MC', captainName: 'Rodrigo Araya', gamertag: 'IgniteFire' },
    { name: 'Aether eSports FC', tag: 'ATH', color: '#6366F1', position: 'MCO', captainName: 'Tomás Parra', gamertag: 'AetherPass' },
    { name: 'Eclipse eSports FC', tag: 'ECL', color: '#D946EF', position: 'POR', captainName: 'Esteban Bravo', gamertag: 'EclipseGk' },
    { name: 'Phantom Legion FC', tag: 'PHN', color: '#14B8A6', position: 'DFC', captainName: 'Nicolás Godoy', gamertag: 'PhantomCap' },
  ];

  // 2. Datos para VALORANT (16 Equipos)
  const valorantTeams = [
    { name: 'Valorant Vipers', tag: 'VPR', color: '#FF4655', position: 'Duelista', captainName: 'Bruno Benítez', gamertag: 'ViperJett' },
    { name: 'Phoenix Knights', tag: 'PNX', color: '#F97316', position: 'Iniciador', captainName: 'Matías Orellana', gamertag: 'PhoenixSova' },
    { name: 'Shadow Strikers', tag: 'SSK', color: '#8B5CF6', position: 'Controlador', captainName: 'Sebastián Palma', gamertag: 'ShadowOmen' },
    { name: 'Radiant Aegis', tag: 'RAG', color: '#00F0FF', position: 'Centinela', captainName: 'Camila Rivas', gamertag: 'AegisKilljoy' },
    { name: 'Omega Protocol', tag: 'OMG', color: '#10B981', position: 'Duelista', captainName: 'Joaquín Soto', gamertag: 'OmegaRaze' },
    { name: 'Spectral Vanguard', tag: 'SPV', color: '#EC4899', position: 'Iniciador', captainName: 'Martina Leiva', gamertag: 'SpectralFade' },
    { name: 'IronClad eSports', tag: 'ICD', color: '#64748B', position: 'Centinela', captainName: 'Gonzalo Vera', gamertag: 'IronCypher' },
    { name: 'Apex Agents', tag: 'APA', color: '#EAB308', position: 'Controlador', captainName: 'Álvaro Espinoza', gamertag: 'ApexBrim' },
    { name: 'Vortex Valorant', tag: 'VXV', color: '#06B6D4', position: 'Duelista', captainName: 'Hugo Fuentes', gamertag: 'VortexReyna' },
    { name: 'Nebula Strikers', tag: 'NBS', color: '#D946EF', position: 'Iniciador', captainName: 'Paula Concha', gamertag: 'NebulaGekko' },
    { name: 'Venom Syndicate', tag: 'VNM', color: '#84CC16', position: 'Controlador', captainName: 'Claudio Garrido', gamertag: 'VenomViper' },
    { name: 'Rogue Radiants', tag: 'RGR', color: '#EF4444', position: 'Duelista', captainName: 'Cristian Muñoz', gamertag: 'RogueYoru' },
    { name: 'Starlight Vipers', tag: 'SLV', color: '#38BDF8', position: 'Centinela', captainName: 'Andrea Pinto', gamertag: 'StarlightDeadlock' },
    { name: 'Quantum Force', tag: 'QTF', color: '#6366F1', position: 'Iniciador', captainName: 'Manuel Sepúlveda', gamertag: 'QuantumBreach' },
    { name: 'Inferno Tactical', tag: 'INF', color: '#F43F5E', position: 'Duelista', captainName: 'Javier Valenzuela', gamertag: 'InfernoIso' },
    { name: 'Cyber Sentinels', tag: 'CSN', color: '#A855F7', position: 'Centinela', captainName: 'Daniela Alarcón', gamertag: 'SentinelChamber' },
  ];

  // 3. Datos para LEAGUE OF LEGENDS (16 Equipos)
  const lolTeams = [
    { name: 'Rift Legends', tag: 'RFT', color: '#C084FC', position: 'MID', captainName: 'Marcos Bustos', gamertag: 'RiftMidKing' },
    { name: 'Baron Nashor eSports', tag: 'BNS', color: '#38BDF8', position: 'JUNGLE', captainName: 'Benjamín Carrasco', gamertag: 'BaronSmite' },
    { name: 'Dragon Slayer Gaming', tag: 'DSG', color: '#F97316', position: 'TOP', captainName: 'Alonso Henríquez', gamertag: 'DragonTop' },
    { name: 'Nexus Destroyers', tag: 'NDS', color: '#EF4444', position: 'ADC', captainName: 'Vicente Marín', gamertag: 'NexusCarry' },
    { name: 'Pentakill eSports', tag: 'PTK', color: '#A855F7', position: 'SUPPORT', captainName: 'Bastián Reyes', gamertag: 'PentaSupport' },
    { name: 'Hextech Titans', tag: 'HTT', color: '#00F0FF', position: 'MID', captainName: 'Ignacia Lagos', gamertag: 'HextechMage' },
    { name: 'Shadow Isles Gaming', tag: 'SIG', color: '#10B981', position: 'JUNGLE', captainName: 'Emilio Pizarro', gamertag: 'IslesGank' },
    { name: 'Summoners Pride', tag: 'SMP', color: '#EAB308', position: 'TOP', captainName: 'Fernando Salazar', gamertag: 'SummonerTank' },
    { name: 'Solaris LoL', tag: 'SLL', color: '#EC4899', position: 'ADC', captainName: 'Carolina Vidal', gamertag: 'SolarisMarksman' },
    { name: 'Void Walkers', tag: 'VWL', color: '#8B5CF6', position: 'MID', captainName: 'Francisco Arenas', gamertag: 'VoidKassadin' },
    { name: 'Starlight Rift', tag: 'SRF', color: '#6366F1', position: 'SUPPORT', captainName: 'Daniela Campos', gamertag: 'StarlightEnchanter' },
    { name: 'Inferno League', tag: 'INL', color: '#F43F5E', position: 'TOP', captainName: 'Guillermo Figueroa', gamertag: 'InfernoBruiser' },
    { name: 'Aether Guardians', tag: 'ATG', color: '#06B6D4', position: 'JUNGLE', captainName: 'Mauricio Jara', gamertag: 'AetherJg' },
    { name: 'Zenith Summoners', tag: 'ZSM', color: '#84CC16', position: 'ADC', captainName: 'Constanza Lara', gamertag: 'ZenithCaitlyn' },
    { name: 'Obsidian Rift', tag: 'ORF', color: '#64748B', position: 'SUPPORT', captainName: 'Hernán Miranda', gamertag: 'ObsidianThresh' },
    { name: 'Vanguard LoL', tag: 'VGL', color: '#D946EF', position: 'MID', captainName: 'Pablo Olave', gamertag: 'VanguardSyndra' },
  ];

  const allGroups = [
    { gameSlug: 'eafc26', teams: eafcTeams, prefix: 'fc' },
    { gameSlug: 'valorant', teams: valorantTeams, prefix: 'val' },
    { gameSlug: 'lol', teams: lolTeams, prefix: 'lol' },
  ];

  let totalTeamsAdded = 0;

  for (const group of allGroups) {
    const { gameSlug, teams, prefix } = group;

    for (let i = 0; i < teams.length; i++) {
      const t = teams[i];
      const teamId = `team-${prefix}-${String(i + 1).padStart(2, '0')}`;
      const captainId = `usr-cap-${prefix}-${String(i + 1).padStart(2, '0')}`;
      const email = `capitan.${t.tag.toLowerCase()}@tournamentspro.esports`;

      // Limpiar capitán o miembros viejos si existían
      await pool.query('DELETE FROM team_members WHERE team_id = ? OR user_id = ?', [teamId, captainId]).catch(() => {});
      await pool.query('DELETE FROM teams WHERE id = ?', [teamId]).catch(() => {});
      await pool.query('DELETE FROM users WHERE id = ? OR email = ?', [captainId, email]).catch(() => {});

      // 1. Insertar Capitán en `users`
      await pool.query(
        `INSERT INTO users 
          (id, email, password_hash, name, gamertag, role, primary_game_slug, platform, position, rating, status)
         VALUES (?, ?, '$2a$12$e/h14zK023Q.4xJjG29u9.V65h8J/vK6jK9.2.1.', ?, ?, 'Capitan', ?, 'CROSSPLAY', ?, 8.5, 'Activo')`,
        [captainId, email, t.captainName, t.gamertag, gameSlug, t.position]
      );

      // 2. Insertar Equipo en `teams`
      await pool.query(
        `INSERT INTO teams
          (id, name, tag, game_slug, captain_id, captain_name, platform, members_count, max_members, color, logo_text, description, status)
         VALUES (?, ?, ?, ?, ?, ?, 'CROSSPLAY', 1, 18, ?, ?, ?, 'Activo')`,
        [teamId, t.name, t.tag, gameSlug, captainId, t.captainName, t.color, t.tag.slice(0, 3), `Escuadra oficial de ${t.name} compitiendo en ${gameSlug.toUpperCase()}.`]
      );

      // 3. Vincular Capitán en `team_members`
      const memberId = `tm-${prefix}-${String(i + 1).padStart(2, '0')}`;
      await pool.query(
        `INSERT INTO team_members (id, team_id, user_id, tactical_position, role_in_team)
         VALUES (?, ?, ?, ?, 'Capitan')`,
        [memberId, teamId, captainId, t.position]
      );

      totalTeamsAdded++;
    }
  }

  console.log(`✅ ${totalTeamsAdded} Equipos y 48 Capitanes creados correctamente en MySQL.`);
  await pool.end();
}

seedTeamsAndCaptains().catch((err) => {
  console.error('❌ Error poblando equipos y capitanes:', err);
  process.exit(1);
});
