export interface TeamData {
  id: string;
  name: string;
  tag: string;
  captain: string;
  membersCount: number;
  description: string;
  bannerUrl: string;
  logoUrl: string;
  logoText: string;
  platform: 'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY';
  status: 'ACTIVO' | 'INACTIVO';
  disputando: string;
  palmares: string;
  color: string;
}

export const mockTeamsList: TeamData[] = [
  {
    id: 'leguayork-esp',
    name: 'LEGUAYORK ESP',
    tag: 'LYE',
    captain: 'Pancho',
    membersCount: 45,
    description: 'Escuadra competitiva e-sports oficial inscrita en los circuitos de Torneos Pro FC.',
    bannerUrl: '/images/games-background/eafc.jpg',
    logoUrl: '',
    logoText: 'LY',
    platform: 'CROSSPLAY',
    status: 'ACTIVO',
    disputando: 'Liga Div 1',
    palmares: '3 Títulos',
    color: '#00F0FF',
  },
  {
    id: 'sangre-nueva-fc',
    name: 'SANGRE NUEVA FC',
    tag: 'SN FC',
    captain: 'Caxorro',
    membersCount: 21,
    description: 'Sangre Nueva FC nace el 16 de julio de 2022 con una idea clara: construir algo distinto. No solo un equipo, sino una identidad.',
    bannerUrl: '/images/games-background/valorant.jpg',
    logoUrl: '',
    logoText: 'SN',
    platform: 'CROSSPLAY',
    status: 'ACTIVO',
    disputando: 'Copa Apertura',
    palmares: '1 Título',
    color: '#EF4444',
  },
  {
    id: 'highfield-xx',
    name: 'HIGHFIELD XX',
    tag: 'HXX',
    captain: 'Vhaex',
    membersCount: 18,
    description: 'Escuadra competitiva e-sports oficial inscrita en los circuitos de Torneos Pro FC.',
    bannerUrl: '/images/games-background/csgo.jpg',
    logoUrl: '',
    logoText: 'HF',
    platform: 'CROSSPLAY',
    status: 'ACTIVO',
    disputando: 'Liga Div 1',
    palmares: 'Sin Títulos',
    color: '#8B5CF6',
  },
  {
    id: 'san-lorenzo-esp',
    name: 'SAN LORENZO ESP',
    tag: 'SL ESP',
    captain: 'SrDeLorean',
    membersCount: 32,
    description: 'Club histórico con amplia trayectoria en torneos internacionales de Clubes Pro y eSports.',
    bannerUrl: '/images/games-background/rocketleague.jpg',
    logoUrl: '',
    logoText: 'SL',
    platform: 'CROSSPLAY',
    status: 'ACTIVO',
    disputando: 'Liga Div 1',
    palmares: '5 Títulos',
    color: '#10B981',
  },
];
