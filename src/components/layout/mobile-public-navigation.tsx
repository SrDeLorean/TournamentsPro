import Link from 'next/link';
import { Flag, Home, Info, LogIn, Shield, User, UserPlus, Users } from 'lucide-react';
import { GameLogo } from '@/components/ui/game-logo';
import { GAMES_CATALOG, type GameConfig } from '@/lib/games-data';

interface MobilePublicNavigationProps {
  currentGame: GameConfig;
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

export function MobilePublicNavigation({ currentGame, isAuthenticated, onClose }: MobilePublicNavigationProps) {
  return (
    <>
      <button type="button" aria-label="Cerrar menú principal" onClick={onClose} className="fixed inset-0 top-14 z-30 bg-[var(--app-overlay)] backdrop-blur-sm lg:hidden" />
      <div id="public-mobile-navigation" className="app-navbar-mobile-menu ui-navigation-popover fixed bottom-0 left-0 right-0 top-14 z-40 space-y-3 overflow-y-auto overscroll-contain rounded-none border-x-0 border-t-0 p-3 touch-pan-y lg:hidden">
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

        <div className="app-navbar-mobile-links space-y-1">
          {publicLinks.map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={onClose} className="ui-navigation-link w-full justify-start">
              <Icon className="size-4" />{label}
            </Link>
          ))}
          {!isAuthenticated ? (
            <div className="grid grid-cols-2 gap-2 border-t border-[var(--border-card)] pt-2">
              <Link href="/login" onClick={onClose} className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-card)] bg-[var(--bg-card-hover)] p-2 text-xs font-bold text-[var(--text-primary)]"><LogIn className="h-3.5 w-3.5 text-[var(--app-accent)]" />Ingresar</Link>
              <Link href="/registro" onClick={onClose} className="flex items-center justify-center gap-1.5 rounded-lg bg-[var(--app-accent)] p-2 text-xs font-black text-[var(--text-heading)]"><UserPlus className="h-3.5 w-3.5" />Registro</Link>
            </div>
          ) : (
            <Link href="/dashboard" onClick={onClose} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] p-2.5 text-xs font-black text-[var(--text-heading)]"><User className="h-4 w-4" />Ir a mi panel</Link>
          )}
        </div>
      </div>
    </>
  );
}
