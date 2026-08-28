import { GameConfig } from './games-data';

export const PUBLIC_GAME_SECTIONS = [
  'organizaciones',
  'competencias',
  'clasificacion',
  'partidos',
  'traspasos',
  'equipos',
  'jugadores',
  'tops',
  'infografia',
  'datos',
] as const;

export type PublicGameSection = (typeof PUBLIC_GAME_SECTIONS)[number];

export const PUBLIC_GAME_NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'organizaciones', label: 'Organizaciones' },
  { id: 'competencias', label: 'Torneos' },
  { id: 'clasificacion', label: 'Clasificación' },
  { id: 'partidos', label: 'Partidos' },
  { id: 'traspasos', label: 'Traspasos' },
  { id: 'equipos', label: 'Equipos' },
  { id: 'jugadores', label: 'Jugadores' },
  { id: 'tops', label: 'Tops' },
  { id: 'infografia', label: 'Infografía' },
  { id: 'datos', label: 'Datos' },
] as const;

export type PublicGameNavigationSection = (typeof PUBLIC_GAME_NAV_ITEMS)[number]['id'];

export function isPublicGameSection(value: string): value is PublicGameSection {
  return PUBLIC_GAME_SECTIONS.includes(value as PublicGameSection);
}

export interface SectionMetadata {
  badgeText: string;
  title: string;
  highlightTitle: string;
  description: string;
  searchPlaceholder?: string;
  filterLabel?: string;
}

export function getSectionMetadata(game: GameConfig, section: string): SectionMetadata {
  const gameName = game.name;
  const isFC = game.slug === 'eafc26';
  const isRL = game.slug === 'rocketleague';
  const teamFormat = isFC ? '11v11' : isRL ? '3v3 y 2v2' : '5v5';
  const matchFormat = isFC ? '11v11 y 1v1' : isRL ? '3v3, 2v2 y 1v1' : '5v5';

  switch (section) {
    case 'competencias':
      return {
        badgeText: `Competencias & Ligas ${teamFormat}`,
        title: 'TORNEOS',
        highlightTitle: 'OFICIALES.',
        description: `Explora el circuito competitivo oficial, copas abiertas y ligas regulares vigentes de ${gameName} en modalidades ${matchFormat}.`,
        searchPlaceholder: `Buscar torneo por nombre, liga u organizador...`,
        filterLabel: 'Estado del Torneo',
      };

    case 'clasificacion':
      return {
        badgeText: `Tabla de Posiciones ${teamFormat}`,
        title: 'CLASIFICACIÓN',
        highlightTitle: 'EN TIEMPO REAL.',
        description: `Tabla general de puntos, diferencia de gol/rondas e historial de rendimiento de las escuadras disputando ${gameName}.`,
        searchPlaceholder: `Buscar club en la tabla...`,
        filterLabel: 'División / Grupo',
      };

    case 'partidos':
      return {
        badgeText: `Fixture & Calendario ${teamFormat}`,
        title: 'CALENDARIO DE',
        highlightTitle: 'PARTIDOS.',
        description: `Revisa la programación de próximos encuentros, horarios de transmisión y resultados en directo de la temporada de ${gameName}.`,
        searchPlaceholder: `Buscar partido por equipo...`,
        filterLabel: 'Jornada / Estado',
      };

    case 'traspasos':
      return {
        badgeText: `Mercado de Fichajes & Agencia Libre`,
        title: 'MERCADO DE',
        highlightTitle: 'TRASPASOS.',
        description: `Directorio de jugadores en agencia libre, solicitudes de traspaso y transferencias aprobadas para las escuadras de ${gameName}.`,
        searchPlaceholder: `Buscar jugador o club interesado...`,
        filterLabel: 'Estado de Fichaje',
      };

    case 'equipos':
      return {
        badgeText: game.teamBadgeText || `Directorio de Escuadras ${teamFormat}`,
        title: game.teamTitle || 'CLUBES',
        highlightTitle: game.teamHighlightTitle || `VIGENTES ${teamFormat}.`,
        description: game.teamDescription || `Conoce todas las organizaciones, clubes de élite y plantillas oficiales que disputan los campeonatos de ${gameName}.`,
        searchPlaceholder: `Buscar club por nombre, tag o capitán...`,
        filterLabel: 'Plataforma / Consola',
      };

    case 'jugadores':
      return {
        badgeText: `Atletas eSports & Fichas de Jugador`,
        title: 'JUGADORES',
        highlightTitle: 'VERIFICADOS.',
        description: `Directorio de deportistas eSports, gamertags registrados y estadísticas individuales en ${gameName}.`,
        searchPlaceholder: `Buscar jugador por nick o gamertag...`,
        filterLabel: 'Posición / Rol',
      };

    case 'tops':
      return {
        badgeText: `Ranking de Líderes por Posición`,
        title: 'TOP JUGADORES',
        highlightTitle: 'POR ROL.',
        description: `Los atletas más destacados y con mejor rendimiento evaluado en cada posición de ${gameName}.`,
        searchPlaceholder: `Filtrar líderes por nick...`,
        filterLabel: 'Posiciones Válidas',
      };

    case 'infografia':
      return {
        badgeText: `Métricas & Métricas eSports`,
        title: 'INFOGRAFÍA Y',
        highlightTitle: 'ESTADÍSTICAS.',
        description: `Resumen visual de volumen de partidos, efectividad general y métricas de desempeño de ${gameName}.`,
      };

    case 'datos':
      return {
        badgeText: `Reglamento & Especificaciones`,
        title: 'BASE DE DATOS',
        highlightTitle: 'TÉCNICA.',
        description: `Normativa oficial, formato de reporte de partidas y especificaciones técnicas para los campeonatos de ${gameName}.`,
      };

    default:
      return {
        badgeText: `Portal Oficial ${teamFormat}`,
        title: gameName,
        highlightTitle: 'PORTAL ECOSISTEMA.',
        description: `Bienvenido al ecosistema eSports de ${gameName}. Revisa torneos, clasificación, plantillas y mercado de fichajes.`,
      };
  }
}
