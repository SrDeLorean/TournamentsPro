import { supabaseProvider as dbProvider } from '../src/lib/db/supabase/provider';

async function seed() {
  console.log('--- Iniciando Seed con Datos Reales y Fotos de EXTRA ---');

  // 1. USUARIOS / ATLETAS PRIMERO (Para tener ownerId y captainId válidos)
  const usersToSeed = [
    {
      id: 'usr-srdelorean',
      name: 'SrDeLorean',
      email: 'srdelorean@tournamentspro.com',
      gamertag: 'SrDeLorean',
      role: 'Jugador',
      primaryGameSlug: 'eafc26',
      platform: 'PS5',
      position: 'MCO',
      rankBadge: 'División 1',
      status: 'active',
      rating: 9.8,
      avatarUrl: '/uploads/usuarios/0ANkDShbpFOHqdj7b6bg_1783718412.webp',
      foto: '/uploads/usuarios/0ANkDShbpFOHqdj7b6bg_1783718412.webp',
    },
    {
      id: 'usr-pancho',
      name: 'Pancho_T10',
      email: 'pancho@tournamentspro.com',
      gamertag: 'Pancho_T10',
      role: 'Jugador',
      primaryGameSlug: 'eafc26',
      platform: 'CROSSPLAY',
      position: 'DC',
      rankBadge: 'Capitán Verificado',
      status: 'active',
      rating: 9.6,
      avatarUrl: '/uploads/usuarios/1Zkhgan1DNOdEdM5S9y6_1783873006.webp',
      foto: '/uploads/usuarios/1Zkhgan1DNOdEdM5S9y6_1783873006.webp',
    },
    {
      id: 'usr-caxorro',
      name: 'Caxorro_SN',
      email: 'caxorro@tournamentspro.com',
      gamertag: 'Caxorro_SN',
      role: 'Jugador',
      primaryGameSlug: 'eafc26',
      platform: 'CROSSPLAY',
      position: 'DFC',
      rankBadge: 'Líder Defensivo',
      status: 'active',
      rating: 9.4,
      avatarUrl: '/uploads/usuarios/1kESBsJoBK8nXJqamQ9e_1787015541.webp',
      foto: '/uploads/usuarios/1kESBsJoBK8nXJqamQ9e_1787015541.webp',
    },
    {
      id: 'usr-vhaex',
      name: 'Vhaex_Pro',
      email: 'vhaex@tournamentspro.com',
      gamertag: 'Vhaex_Pro',
      role: 'Jugador',
      primaryGameSlug: 'eafc26',
      platform: 'PC',
      position: 'MCD',
      rankBadge: 'Élite',
      status: 'active',
      rating: 9.2,
      avatarUrl: '/uploads/usuarios/2ha5lrCfeFMXP7uE7xsP_1783894425.webp',
      foto: '/uploads/usuarios/2ha5lrCfeFMXP7uE7xsP_1783894425.webp',
    },
    {
      id: 'usr-fallen',
      name: 'Gabriel FalleN',
      email: 'fallen@tournamentspro.com',
      gamertag: 'FalleN_N1',
      role: 'Jugador',
      primaryGameSlug: 'csgo',
      platform: 'PC',
      position: 'AWPer / IGL',
      rankBadge: 'Major Legend',
      status: 'active',
      rating: 9.9,
      avatarUrl: '/uploads/usuarios/4EWg1Uv9sVCtjh10zoT8_1787620542.webp',
      foto: '/uploads/usuarios/4EWg1Uv9sVCtjh10zoT8_1787620542.webp',
    },
    {
      id: 'usr-keznit',
      name: 'Angelo Keznit',
      email: 'keznit@tournamentspro.com',
      gamertag: 'Keznit_God',
      role: 'Jugador',
      primaryGameSlug: 'valorant',
      platform: 'PC',
      position: 'Duelista',
      rankBadge: 'Radiant Top 1',
      status: 'active',
      rating: 9.9,
      avatarUrl: '/uploads/usuarios/5KujJ3pjd4sKpx92vZdB_1786079232.webp',
      foto: '/uploads/usuarios/5KujJ3pjd4sKpx92vZdB_1786079232.webp',
    },
    {
      id: 'usr-seiya',
      name: 'Edgar Seiya',
      email: 'seiya@tournamentspro.com',
      gamertag: 'Seiya_LoL',
      role: 'Jugador',
      primaryGameSlug: 'lol',
      platform: 'PC',
      position: 'MID',
      rankBadge: 'Challenger',
      status: 'active',
      rating: 9.7,
      avatarUrl: '/uploads/usuarios/6qHrAa9yrSwwEp7iOzve_1784130334.webp',
      foto: '/uploads/usuarios/6qHrAa9yrSwwEp7iOzve_1784130334.webp',
    },
    {
      id: 'usr-yanxnz',
      name: 'Yan Yanxnz',
      email: 'yanxnz@tournamentspro.com',
      gamertag: 'Yanxnz_SSL',
      role: 'Jugador',
      primaryGameSlug: 'rocketleague',
      platform: 'PC',
      position: 'Striker',
      rankBadge: 'Supersonic Legend',
      status: 'active',
      rating: 9.8,
      avatarUrl: '/uploads/usuarios/9NUM4gqeO7e7eHY8EmbS_1786482401.webp',
      foto: '/uploads/usuarios/9NUM4gqeO7e7eHY8EmbS_1786482401.webp',
    },
    {
      id: 'usr-frubilar',
      name: 'Frubilar13',
      email: 'frubilar@tournamentspro.com',
      gamertag: 'Frubilar13',
      role: 'Jugador',
      primaryGameSlug: 'eafc26',
      platform: 'CROSSPLAY',
      position: 'POR',
      rankBadge: 'Guante de Oro',
      status: 'active',
      rating: 9.1,
      avatarUrl: '/uploads/usuarios/4FB6nEJvuWSArVzrlT2j_1783872989.webp',
      foto: '/uploads/usuarios/4FB6nEJvuWSArVzrlT2j_1783872989.webp',
    },
    {
      id: 'usr-matias-aud',
      name: 'Matias_Italico',
      email: 'matias@tournamentspro.com',
      gamertag: 'Matias_AUD',
      role: 'Jugador',
      primaryGameSlug: 'eafc26',
      platform: 'PS5',
      position: 'EI',
      rankBadge: 'Extremo Veloz',
      status: 'active',
      rating: 9.0,
      avatarUrl: '/uploads/usuarios/5bzobiXQ98yUWqFGt08H_1784043270.webp',
      foto: '/uploads/usuarios/5bzobiXQ98yUWqFGt08H_1784043270.webp',
    },
    {
      id: 'usr-diego-uk',
      name: 'Diego_Knight',
      email: 'diego@tournamentspro.com',
      gamertag: 'Diego_UK',
      role: 'Jugador',
      primaryGameSlug: 'eafc26',
      platform: 'XBOX',
      position: 'ED',
      rankBadge: 'Desequilibrante',
      status: 'active',
      rating: 8.9,
      avatarUrl: '/uploads/usuarios/72wwfBNR42X2Fsae7XDS_1784143377.webp',
      foto: '/uploads/usuarios/72wwfBNR42X2Fsae7XDS_1784143377.webp',
    },
  ];

  for (const user of usersToSeed) {
    try {
      const existing = await dbProvider.users.findById(user.id);
      if (!existing) {
        await dbProvider.users.create(user as any);
        console.log(`✓ Usuario creado: ${user.name}`);
      } else {
        await dbProvider.users.update(user.id, user as any);
        console.log(`✓ Usuario actualizado: ${user.name}`);
      }
    } catch (e: any) {
      console.error(`Error en user ${user.name}:`, e.message);
    }
  }

  // 2. ORGANIZACIONES
  const orgsToSeed = [
    {
      id: 'org-torneos-pro-fc',
      name: 'Torneos Pro FC Oficial',
      tag: 'TPFC',
      ownerId: 'usr-srdelorean',
      logoUrl: '/uploads/organizaciones/bkSJghIEKQThmtj4VEi1_1782020535.webp',
      bannerUrl: '/uploads/organizaciones/2L7tJhvlOhkbFmanqiz1_1782020541.webp',
      description: 'Organización oficial insignia de torneos de Clubes Pro 11v11, FPS y circuitos internacionales.',
      country: 'CL',
      status: 'active',
      allowedGames: ['eafc26', 'valorant', 'csgo', 'lol', 'rocketleague'],
    },
    {
      id: 'org-ngl-chile',
      name: 'NGL National Gaming',
      tag: 'NGL',
      ownerId: 'usr-srdelorean',
      logoUrl: '/uploads/competencias/Rh7qH1IGyPiYSn9xC3K6_1782025284.webp',
      bannerUrl: '/uploads/organizaciones/2L7tJhvlOhkbFmanqiz1_1782020541.webp',
      description: 'Liga nacional competitiva con divisiones Primera, Ascenso y Torneos de Copa.',
      country: 'CL',
      status: 'active',
      allowedGames: ['eafc26'],
    },
    {
      id: 'org-sabado-gaming-2',
      name: 'Sábado Gaming eSports',
      tag: 'SBG',
      ownerId: 'usr-srdelorean',
      logoUrl: '/uploads/organizaciones/WyKogwYALZRGRE0ZYkd5_1784586137.webp',
      bannerUrl: '/uploads/organizaciones/IbgMz3hTP6e372xPF2wc_1784586146.webp',
      description: 'Comunidad de torneos relámpago y fines de semana gaming.',
      country: 'CL',
      status: 'active',
      allowedGames: ['eafc26', 'valorant'],
    },
  ];

  for (const org of orgsToSeed) {
    try {
      const existing = await dbProvider.organizations.findById(org.id);
      if (!existing) {
        await dbProvider.organizations.create(org as any);
        console.log(`✓ Organización creada: ${org.name}`);
      } else {
        await dbProvider.organizations.update(org.id, org as any);
        console.log(`✓ Organización actualizada: ${org.name}`);
      }
    } catch (e: any) {
      console.error(`Error en org ${org.name}:`, e.message);
    }
  }

  // 3. EQUIPOS / CLUBES
  const teamsToSeed = [
    {
      id: 'team-leguayork',
      name: 'LeguaYork eSp',
      tag: 'LYE',
      gameSlug: 'eafc26',
      captainId: 'usr-pancho',
      captainName: 'Pancho_T10',
      organizationId: 'org-torneos-pro-fc',
      logoUrl: '/uploads/equipos/vBHIgHcKxYAGa7eySYtQ_1786465550.webp',
      bannerUrl: '/images/games-background/eafc.jpg',
      description: 'Escuadra competitiva e-sports oficial inscrita en los circuitos de Torneos Pro FC.',
      status: 'active',
      membersCount: 45,
      maxMembers: 45,
      color: '#00F0FF',
      logoText: 'LY',
      vacantPositions: ['MCD', 'LI'],
    },
    {
      id: 'team-sangre-nueva',
      name: 'Sangre Nueva FC',
      tag: 'SN FC',
      gameSlug: 'eafc26',
      captainId: 'usr-caxorro',
      captainName: 'Caxorro_SN',
      organizationId: 'org-torneos-pro-fc',
      logoUrl: '/uploads/equipos/TcJRrKKYMU0AQcfmRnXN_1784583945.webp',
      bannerUrl: '/uploads/equipos/YYBIw10vcqS2QfF9QWVN_1784584698.webp',
      description: 'Sangre Nueva FC nace el 16 de julio de 2022 con una idea clara: construir algo distinto. No solo un equipo, sino una identidad.',
      status: 'active',
      membersCount: 21,
      maxMembers: 45,
      color: '#EF4444',
      logoText: 'SN',
      vacantPositions: ['DC', 'ED'],
    },
    {
      id: 'team-san-lorenzo',
      name: 'San Lorenzo eSp',
      tag: 'SLE',
      gameSlug: 'eafc26',
      captainId: 'usr-srdelorean',
      captainName: 'SrDeLorean',
      organizationId: 'org-ngl-chile',
      logoUrl: '/uploads/equipos/5DFT7ABBa43ofW3rww0L_1783646061.webp',
      bannerUrl: '/uploads/equipos/0hCeAuWMmz2WfCVdejcC_1783646086.webp',
      description: 'Club histórico con amplia trayectoria en torneos internacionales de Clubes Pro y eSports.',
      status: 'active',
      membersCount: 32,
      maxMembers: 45,
      color: '#10B981',
      logoText: 'SL',
      vacantPositions: ['POR', 'DFC'],
    },
    {
      id: 'team-papayeros',
      name: 'PAPAYEROS RISING',
      tag: 'RSG',
      gameSlug: 'eafc26',
      captainId: 'usr-srdelorean',
      captainName: 'Papayero_Cap',
      organizationId: 'org-ngl-chile',
      logoUrl: '/uploads/equipos/FQDibIpHE2a9IYU0DGGd_1784852582.webp',
      bannerUrl: '/images/games-background/eafc.jpg',
      description: 'Escuadra representativa del norte chileno con gran disciplina táctica.',
      status: 'active',
      membersCount: 22,
      maxMembers: 45,
      color: '#FBBF24',
      logoText: 'RSG',
      vacantPositions: ['MCO'],
    },
    {
      id: 'team-smart-esports',
      name: 'Smart Esports',
      tag: 'SMT',
      gameSlug: 'eafc26',
      captainId: 'usr-srdelorean',
      captainName: 'Smart_Lead',
      organizationId: 'org-torneos-pro-fc',
      logoUrl: '/uploads/equipos/Fs0g1nG4YysYEsM7rj8H_1782022611.webp',
      bannerUrl: '/images/games-background/eafc.jpg',
      description: 'Smart Esports Clubes Pro 11 vs 11.',
      status: 'active',
      membersCount: 19,
      maxMembers: 45,
      color: '#38BDF8',
      logoText: 'SMT',
      vacantPositions: [],
    },
    {
      id: 'team-bsk-esports',
      name: 'BSK ESPORTS',
      tag: 'BSK',
      gameSlug: 'eafc26',
      captainId: 'usr-srdelorean',
      captainName: 'Lucas_BSK',
      organizationId: 'org-torneos-pro-fc',
      logoUrl: '/uploads/equipos/WhpHJ3BY3t4c1b4CKq64_1783646037.webp',
      bannerUrl: '/images/games-background/eafc.jpg',
      description: 'Club competitivo de alta competencia en torneos Sudamericanos.',
      status: 'active',
      membersCount: 28,
      maxMembers: 45,
      color: '#A855F7',
      logoText: 'BSK',
      vacantPositions: [],
    },
    {
      id: 'team-audax-esports',
      name: 'Audax Esports',
      tag: 'AUD',
      gameSlug: 'eafc26',
      captainId: 'usr-matias-aud',
      captainName: 'Matias_AUD',
      organizationId: 'org-ngl-chile',
      logoUrl: '/uploads/equipos/Khr6no1kZ2HzUcyLYwyT_1783646344.webp',
      bannerUrl: '/images/games-background/eafc.jpg',
      description: 'Rama de deportes electrónicos del histórico club itálico.',
      status: 'active',
      membersCount: 26,
      maxMembers: 45,
      color: '#059669',
      logoText: 'AUD',
      vacantPositions: ['MCD'],
    },
    {
      id: 'team-urban-knights',
      name: 'Urban Knights',
      tag: 'UK',
      gameSlug: 'eafc26',
      captainId: 'usr-diego-uk',
      captainName: 'Diego_UK',
      organizationId: 'org-torneos-pro-fc',
      logoUrl: '/uploads/equipos/gMqJCYIpWm5iWGjSP3Dc_1783646342.webp',
      bannerUrl: '/images/games-background/eafc.jpg',
      description: 'Caballeros urbanos listos para conquistar la escena de Clubes Pro.',
      status: 'active',
      membersCount: 25,
      maxMembers: 45,
      color: '#3B82F6',
      logoText: 'UK',
      vacantPositions: [],
    },
    {
      id: 'team-rangers-esports',
      name: 'Rangers Espørts',
      tag: 'RNG',
      gameSlug: 'eafc26',
      captainId: 'usr-srdelorean',
      captainName: 'Alexis_RNG',
      organizationId: 'org-ngl-chile',
      logoUrl: '/uploads/equipos/dWHCWagRiMjRWg2eIqQi_1783647689.webp',
      bannerUrl: '/uploads/equipos/bRlGeb6iuNldF9Y7WnrW_1783647699.webp',
      description: 'Rangers eSports, identidad piducana en el fútbol virtual.',
      status: 'active',
      membersCount: 24,
      maxMembers: 45,
      color: '#DC2626',
      logoText: 'RNG',
      vacantPositions: [],
    },
    {
      id: 'team-puerto-montt',
      name: 'Deportes Puerto Montt eSports',
      tag: 'DPM',
      gameSlug: 'eafc26',
      captainId: 'usr-srdelorean',
      captainName: 'PtoMontt_Lead',
      organizationId: 'org-torneos-pro-fc',
      logoUrl: '/uploads/equipos/RcUqiCRz65Gep5KoPX8q_1784039289.webp',
      bannerUrl: '/uploads/equipos/LEuqxyBR9TmMxuBOLXcA_1784039307.webp',
      description: 'Los hijos del temporal compitiendo al más alto nivel nacional.',
      status: 'active',
      membersCount: 30,
      maxMembers: 45,
      color: '#2563EB',
      logoText: 'DPM',
      vacantPositions: [],
    },
  ];

  for (const team of teamsToSeed) {
    try {
      const existing = await dbProvider.teams.findById(team.id);
      if (!existing) {
        await dbProvider.teams.create(team as any);
        console.log(`✓ Equipo creado: ${team.name}`);
      } else {
        await dbProvider.teams.update(team.id, team as any);
        console.log(`✓ Equipo actualizado: ${team.name}`);
      }
    } catch (e: any) {
      console.error(`Error en team ${team.name}:`, e.message);
    }
  }

  // 4. COMPETENCIAS / TORNEOS
  const compsToSeed = [
    {
      id: 'comp-ngl-10-primera',
      name: 'NGL 10 - Primera División',
      gameSlug: 'eafc26',
      organizationId: 'org-ngl-chile',
      organizerId: 'usr-srdelorean',
      organizerName: 'SrDeLorean',
      format: 'Liga',
      status: 'in_progress',
      modeFormat: '11v11',
      transferMarketMode: 'ABIERTO',
      prizePool: '$5,000 USD',
      fechaInicio: new Date().toISOString(),
      description: 'La máxima categoría del circuito NGL 11v11 con los 16 mejores clubes.',
    },
    {
      id: 'comp-elite-cup',
      name: 'Copa Elite 2026',
      gameSlug: 'eafc26',
      organizationId: 'org-torneos-pro-fc',
      organizerId: 'usr-srdelorean',
      organizerName: 'SrDeLorean',
      format: 'Copa',
      status: 'in_progress',
      modeFormat: '11v11',
      transferMarketMode: 'ABIERTO',
      prizePool: '$3,500 USD',
      fechaInicio: new Date().toISOString(),
      description: 'Torneo eliminatorio de alto rendimiento para clubes verificados.',
    },
    {
      id: 'comp-ascenso-pro',
      name: 'Ascenso Pro League',
      gameSlug: 'eafc26',
      organizationId: 'org-ngl-chile',
      organizerId: 'usr-srdelorean',
      organizerName: 'SrDeLorean',
      format: 'Liga',
      status: 'in_progress',
      modeFormat: '11v11',
      transferMarketMode: 'ABIERTO',
      prizePool: '$2,000 USD',
      fechaInicio: new Date().toISOString(),
      description: 'Segunda división competitiva con cupos directos a Primera.',
    },
    {
      id: 'comp-anfa-championship',
      name: 'Torneo ANFA eSports',
      gameSlug: 'eafc26',
      organizationId: 'org-torneos-pro-fc',
      organizerId: 'usr-srdelorean',
      organizerName: 'SrDeLorean',
      format: 'Copa',
      status: 'inscripciones',
      modeFormat: '11v11',
      transferMarketMode: 'ABIERTO',
      prizePool: '$1,500 USD',
      fechaInicio: new Date().toISOString(),
      description: 'Torneo de integración nacional abierta para todas las escuadras.',
    },
    {
      id: 'comp-prospect-cup',
      name: 'Prospect Cup 2026',
      gameSlug: 'eafc26',
      organizationId: 'org-sabado-gaming-2',
      organizerId: 'usr-srdelorean',
      organizerName: 'SrDeLorean',
      format: 'Copa',
      status: 'in_progress',
      modeFormat: '11v11',
      transferMarketMode: 'ABIERTO',
      prizePool: '$1,000 USD',
      fechaInicio: new Date().toISOString(),
      description: 'Torneo de descubrimiento de nuevas promesas y clubes emergentes.',
    },
  ];

  for (const comp of compsToSeed) {
    try {
      const existing = await dbProvider.competitions.findById(comp.id);
      if (!existing) {
        await dbProvider.competitions.create(comp as any);
        console.log(`✓ Competencia creada: ${comp.name}`);
      } else {
        await dbProvider.competitions.update(comp.id, comp as any);
        console.log(`✓ Competencia actualizada: ${comp.name}`);
      }
    } catch (e: any) {
      console.error(`Error en comp ${comp.name}:`, e.message);
    }
  }

  // 5. INTEGRANTES DE PLANTILLA (TEAM MEMBERS)
  const teamMembersToSeed = [
    // LeguaYork eSp
    {
      id: 'tm-lye-pancho',
      team_id: 'team-leguayork',
      user_id: 'usr-pancho',
      jersey_number: 9,
      tactical_position: 'DC',
      role_in_team: 'Capitan',
      organization_name: 'Torneos Pro FC Oficial',
    },
    {
      id: 'tm-lye-vhaex',
      team_id: 'team-leguayork',
      user_id: 'usr-vhaex',
      jersey_number: 6,
      tactical_position: 'MCD',
      role_in_team: 'Jugador',
      organization_name: 'Torneos Pro FC Oficial',
    },
    {
      id: 'tm-lye-frubilar',
      team_id: 'team-leguayork',
      user_id: 'usr-frubilar',
      jersey_number: 1,
      tactical_position: 'POR',
      role_in_team: 'Jugador',
      organization_name: 'Torneos Pro FC Oficial',
    },
    // Sangre Nueva FC
    {
      id: 'tm-sn-caxorro',
      team_id: 'team-sangre-nueva',
      user_id: 'usr-caxorro',
      jersey_number: 4,
      tactical_position: 'DFC',
      role_in_team: 'Capitan',
      organization_name: 'Torneos Pro FC Oficial',
    },
    {
      id: 'tm-sn-matias',
      team_id: 'team-sangre-nueva',
      user_id: 'usr-matias-aud',
      jersey_number: 11,
      tactical_position: 'EI',
      role_in_team: 'Jugador',
      organization_name: 'Torneos Pro FC Oficial',
    },
    // San Lorenzo eSp
    {
      id: 'tm-sle-srdelorean',
      team_id: 'team-san-lorenzo',
      user_id: 'usr-srdelorean',
      jersey_number: 10,
      tactical_position: 'MCO',
      role_in_team: 'Capitan',
      organization_name: 'NGL National Gaming',
    },
    {
      id: 'tm-sle-diego',
      team_id: 'team-san-lorenzo',
      user_id: 'usr-diego-uk',
      jersey_number: 7,
      tactical_position: 'ED',
      role_in_team: 'Jugador',
      organization_name: 'NGL National Gaming',
    },
  ];

  try {
    const { supabase } = await import('../src/lib/db/supabase/client');
    for (const tm of teamMembersToSeed) {
      const { error } = await supabase.from('team_members').upsert(tm);
      if (error) {
        console.error(`Error al insertar team_member ${tm.id}:`, error.message);
      } else {
        console.log(`✓ Integrante de plantilla asignado: ${tm.user_id} -> ${tm.team_id}`);
      }
    }
  } catch (e: any) {
    console.error('Error poblando team_members:', e.message);
  }

  console.log('--- ¡Seed completado exitosamente con todas las fotos e identidades reales! ---');
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
