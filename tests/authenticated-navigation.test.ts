import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { findManagedTeamForUser, getAthleteNavigation, getClubNavigation } from '../src/lib/authenticated-navigation';

describe('authenticated player and captain navigation', () => {
  it('builds athlete shortcuts only from routes that exist', () => {
    expect(getAthleteNavigation('eafc26', 'player-7').map((item) => item.href)).toEqual([
      '/eafc26/atleta',
      '/eafc26/atleta/ficha',
      '/eafc26/atleta/estadisticas',
      '/eafc26/atleta/ofertas',
      '/eafc26/atleta/equipos',
      '/eafc26/atleta/historial',
      '/eafc26/atleta/mensajes',
      '/eafc26/atleta/ajustes',
    ]);
  });

  it('builds captain shortcuts from the current club routes', () => {
    expect(getClubNavigation('eafc26', 'team-9').map((item) => item.href)).toEqual([
      '/eafc26/club',
      '/eafc26/club/ficha',
      '/eafc26/club/plantilla',
      '/eafc26/club/fichajes',
      '/eafc26/club/matchday',
      '/eafc26/club/estadisticas',
      '/eafc26/club/historial',
      '/eafc26/club/mensajes',
      '/eafc26/club/ajustes',
    ]);
  });

  it('uses the same captain and delegated-manager detection on desktop and mobile', () => {
    const delegatedTeam = {
      id: 'team-9',
      name: 'Club Nueve',
      gameSlug: 'eafc26',
      encargados: JSON.stringify([{ id: 'player-7' }]),
    };
    const user = { id: 'player-7', name: 'Jugador', gamertag: 'J7' };

    expect(findManagedTeamForUser([delegatedTeam] as never[], user as never, 'eafc26')?.id).toBe('team-9');
    expect(findManagedTeamForUser([delegatedTeam] as never[], user as never, 'valorant')).toBeUndefined();
  });

  it('renders one contextual desktop workspace instead of two stacked bars', async () => {
    const [gameNav, contextNav, mobileNav, topNav] = await Promise.all([
      readFile('src/components/layout/game-sub-navbar.tsx', 'utf8'),
      readFile('src/components/layout/authenticated-context-subnavbar.tsx', 'utf8'),
      readFile('src/components/layout/mobile-responsive-subnavbar.tsx', 'utf8'),
      readFile('src/components/layout/admin-navbar.tsx', 'utf8'),
    ]);

    expect(gameNav).toContain('<AuthenticatedContextSubnavbar gameSlug={game.slug} />');
    expect(gameNav).not.toContain('<UserAthleteSubnavbar');
    expect(gameNav).not.toContain('<TeamClubSubnavbar');
    expect(contextNav).toContain('getAthleteNavigation');
    expect(contextNav).toContain('getClubNavigation');
    expect(contextNav).toContain('Crear club');
    expect(contextNav).toContain('<CreateTeamModal');
    expect(contextNav).toContain("pathname.startsWith(`/${gameSlug}/club`)");
    expect(mobileNav).toContain('getAthleteNavigation');
    expect(mobileNav).toContain('getClubNavigation');
    expect(mobileNav).toContain('Crear club');
    expect(mobileNav).toContain('<CreateTeamModal');
    expect(mobileNav).toContain("pathname.startsWith(`/${game.slug}/club`)");
    expect(topNav).toContain('authenticated-explore-menu');
    expect(topNav).not.toContain('<NavLinks');
  });

  it('keeps every private tab under the game layout and protects it with the proxy', async () => {
    const [athletePage, clubPage, proxy] = await Promise.all([
      readFile('src/app/[gameSlug]/atleta/[section]/page.tsx', 'utf8'),
      readFile('src/app/[gameSlug]/club/[section]/page.tsx', 'utf8'),
      readFile('src/proxy.ts', 'utf8'),
    ]);

    expect(athletePage).toContain('ATHLETE_SECTIONS.includes');
    expect(clubPage).toContain('CLUB_SECTIONS.includes');
    expect(proxy).toContain('PRIVATE_GAME_CONTEXT');
    expect(proxy).toContain('"/:gameSlug/atleta/:path*"');
    expect(proxy).toContain('"/:gameSlug/club/:path*"');
  });

  it('keeps the player team, preferences and account menus theme-aware', async () => {
    const [navbar, styles] = await Promise.all([
      readFile('src/components/layout/admin-navbar.tsx', 'utf8'),
      readFile('src/app/globals.css', 'utf8'),
    ]);

    expect(navbar).toContain('player-team-switcher');
    expect(navbar).toContain("'--player-game': currentGameObj.brandColor");
    expect(navbar).toContain('id="player-preferences-menu"');
    expect(navbar).toContain('id="player-user-menu"');
    expect(navbar.match(/href="\/cuenta\/ajustes"/g)).toHaveLength(2);
    expect(navbar).not.toContain('bg-slate-950/95 border border-cyan-500/40');
    expect(styles).toContain('.player-team-switcher');
    expect(styles).toContain('.player-team-option.is-active');
    expect(styles).toContain('var(--bg-card)');
  });
});
