import type { ReactNode } from 'react';
import {
  ArrowRightLeft,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Database,
  Gamepad2,
  Home,
  LayoutDashboard,
  MessageSquare,
  PieChart,
  Shield,
  Star,
  Swords,
  Target,
  Users,
} from 'lucide-react';

export interface ManagementNavigationItem {
  title: string;
  href: string;
  icon: ReactNode;
  badge: string;
}

export const adminNavItems: ManagementNavigationItem[] = [
  { title: 'Dashboard Global', href: '/dashboard', icon: <LayoutDashboard className="size-4 text-[var(--app-accent)]" />, badge: 'Stats' },
  { title: 'Gestión Organizaciones', href: '/dashboard/organizaciones', icon: <Building2 className="size-4 text-[var(--app-positive)]" />, badge: 'Orgs.' },
  { title: 'Gestión Disciplinas', href: '/dashboard/disciplinas', icon: <Gamepad2 className="size-4 text-[var(--app-danger)]" />, badge: 'Juegos' },
  { title: 'Gestión de Competencias', href: '/dashboard/competencias', icon: <Swords className="size-4 text-[var(--app-accent-2)]" />, badge: 'Ligas' },
  { title: 'Usuarios / Atletas', href: '/dashboard/usuarios', icon: <Users className="size-4 text-[var(--app-positive)]" />, badge: 'Directorio' },
  { title: 'Clubes & Plantillas', href: '/dashboard/equipos', icon: <Shield className="size-4 text-[var(--app-warning)]" />, badge: 'Todas las Orgs' },
  { title: 'Reportar Encuentros', href: '/dashboard/matchday', icon: <CheckCircle2 className="size-4 text-[var(--app-danger)]" />, badge: 'Matchday' },
  { title: 'Moderación & Chat Global', href: '/dashboard/moderacion', icon: <MessageSquare className="size-4 text-[var(--app-warning)]" />, badge: 'Bans/Chat' },
];

export const organizerNavItems: ManagementNavigationItem[] = [
  { title: 'Centro operativo', href: '/dashboard', icon: <LayoutDashboard className="size-4 text-[var(--app-accent)]" />, badge: 'Inicio' },
  { title: 'Mis competencias', href: '/dashboard/competencias', icon: <Swords className="size-4 text-[var(--app-accent-2)]" />, badge: 'Ligas' },
  { title: 'Usuarios / Atletas', href: '/dashboard/usuarios', icon: <Users className="size-4 text-[var(--app-accent)]" />, badge: 'Directorio' },
  { title: 'Clubes & Plantillas', href: '/dashboard/equipos', icon: <Shield className="size-4 text-[var(--app-warning)]" />, badge: 'Mi Organización' },
  { title: 'Operación matchday', href: '/dashboard/matchday', icon: <CheckCircle2 className="size-4 text-[var(--app-danger)]" />, badge: 'Partidos' },
  { title: 'Moderación & Chat', href: '/dashboard/moderacion', icon: <MessageSquare className="size-4 text-[var(--app-warning)]" />, badge: 'Bans/Chat' },
];

export function getDisciplineNavItems(activeGameSlug: string, activeGameName: string): ManagementNavigationItem[] {
  return [
    { title: `Portada (${activeGameName})`, href: `/${activeGameSlug}`, icon: <Home className="size-4 text-[var(--text-secondary)]" />, badge: 'Home' },
    { title: 'Organizaciones', href: `/${activeGameSlug}/organizaciones`, icon: <Target className="size-4 text-[var(--app-warning)]" />, badge: 'Orgs.' },
    { title: 'Torneos y competencias', href: `/${activeGameSlug}/competencias`, icon: <Swords className="size-4 text-[var(--app-accent-2)]" />, badge: 'Torneos' },
    { title: 'Clasificación', href: `/${activeGameSlug}/clasificacion`, icon: <Award className="size-4 text-[var(--app-accent-2)]" />, badge: 'Tabla' },
    { title: 'Partidos / Fixture', href: `/${activeGameSlug}/partidos`, icon: <Calendar className="size-4 text-[var(--app-positive)]" />, badge: 'Partidos' },
    { title: 'Traspasos & Fichajes', href: `/${activeGameSlug}/traspasos`, icon: <ArrowRightLeft className="size-4 text-[var(--app-danger)]" />, badge: 'Fichajes' },
    { title: 'Equipos & Clubes', href: `/${activeGameSlug}/equipos`, icon: <Shield className="size-4 text-[var(--app-warning)]" />, badge: 'Clubes' },
    { title: 'Jugadores', href: `/${activeGameSlug}/jugadores`, icon: <Users className="size-4 text-[var(--app-accent)]" />, badge: 'Atletas' },
    { title: 'Tops & Rankings', href: `/${activeGameSlug}/tops`, icon: <Star className="size-4 text-[var(--app-warning)]" />, badge: 'Tops' },
    { title: 'Infografía & Stats', href: `/${activeGameSlug}/infografia`, icon: <PieChart className="size-4 text-[var(--app-accent)]" />, badge: 'Stats' },
    { title: 'Datos & Ficha Técnica', href: `/${activeGameSlug}/datos`, icon: <Database className="size-4 text-[var(--text-muted)]" />, badge: 'Datos' },
  ];
}

export function isNavigationItemActive(pathname: string, href: string): boolean {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const normalizedHref = href.replace(/\/+$/, '') || '/';
  const segments = normalizedHref.split('/').filter(Boolean);

  if (segments.length <= 1) {
    return normalizedPath === normalizedHref;
  }
  return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
}
