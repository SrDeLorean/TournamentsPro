import Link from 'next/link';
import { Flag, Home, Info, LogIn, Shield, User, UserPlus, Users, X } from 'lucide-react';
import { GameLogo } from '@/components/ui/game-logo';
import { GAMES_CATALOG, type GameConfig } from '@/lib/games-data';

interface MobilePublicNavigationProps {
  currentGame: GameConfig;
  currentPath: string;
  isAuthenticated: boolean;
  onClose: () => void;
}

const publicLinks = [
  { href: '/', label: 'Inicio', Icon: Home },
  { href: '/equipos', label: 'Directorio de Equipos', Icon: Shield },
  { href: '/organizaciones', label: 'Organizaciones', Icon: Flag },
  { href: '/usuarios', label: 'Usuarios & Atletas', Icon: Users },
  { href: '/informacion', label: 'Información & Reglamento', Icon: Info },
] as const;

export function MobilePublicNavigation({ currentGame, currentPath, isAuthenticated, onClose }: MobilePublicNavigationProps) {
  return (
    <>
      <button type="button" aria-label="Cerrar menú principal" onClick={onClose} className="fixed inset-0 top-14 z-30 bg-[var(--app-overlay)] backdrop-blur-sm lg:hidden" />
      <div id="public-mobile-navigation" className="app-navbar-mobile-menu fixed bottom-0 right-0 top-14 z-40 h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] space-y-3 overflow-y-auto overscroll-contain touch-pan-y bg-[var(--bg-card)] lg:hidden">
        <div className="app-navbar-mobile-heading">
          <span>
            <strong>Navegación</strong>
            <small>Explora la plataforma y sus disciplinas</small>
          </span>
          <button type="button" onClick={onClose} className="ui-navigation-icon-button" aria-label="Cerrar navegación global">
            <X className="size-4" />
          </button>
        </div>

        <section className="mobile-games-panel" aria-labelledby="mobile-games-title" style={{ '--mobile-game-color': currentGame.brandColor } as React.CSSProperties}>
          <div className="mobile-games-heading">
            <div>
              <GameLogo game={currentGame} size="sm" />
              <span className="mobile-games-active-copy"><small id="mobile-games-title">Disciplina activa</small><strong>{currentGame.name}</strong></span>
            </div>
            <small>Cambiar disciplina</small>
          </div>
          <div className="mobile-games-grid">
            {Object.values(GAMES_CATALOG).map((game) => {
              const isActive = game.slug === currentGame.slug;
              return (
                <Link key={game.id} href={`/${game.slug}`} onClick={onClose} className={isActive ? 'is-active' : ''} aria-current={isActive ? 'page' : undefined} style={{ '--mobile-game-color': game.brandColor } as React.CSSProperties}>
                  <GameLogo game={game} size="sm" />
                  <span><strong>{game.name}</strong><small>{game.category}</small></span>
                </Link>
              );
            })}
          </div>
        </section>

        <nav className="app-navbar-mobile-links space-y-1" aria-label="Navegación pública móvil">
          {publicLinks.map(({ href, label, Icon }) => {
            const isActive = href === '/' ? currentPath === href : currentPath.startsWith(href);
            return (
              <Link key={href} href={href} onClick={onClose} aria-current={isActive ? 'page' : undefined} className={`ui-navigation-link w-full justify-start${isActive ? ' is-active' : ''}`}>
                <Icon className="size-4" />{label}
              </Link>
            );
          })}
          {!isAuthenticated ? (
            <div className="app-navbar-mobile-auth grid grid-cols-2 gap-2 border-t border-[var(--border-card)] pt-2">
              <Link href="/login" onClick={onClose} className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-card)] bg-[var(--bg-card-hover)] p-2 text-xs font-bold text-[var(--text-primary)]"><LogIn className="h-3.5 w-3.5 text-[var(--navigation-brand)]" />Ingresar</Link>
              <Link href="/registro" onClick={onClose} className="navigation-primary-action flex items-center justify-center gap-1.5 rounded-lg p-2 text-xs font-black"><UserPlus className="h-3.5 w-3.5" />Registro</Link>
            </div>
          ) : (
            <Link href="/dashboard" onClick={onClose} className="navigation-primary-action flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-black"><User className="h-4 w-4" />Ir a mi panel</Link>
          )}
        </nav>
      </div>
    </>
  );
}
