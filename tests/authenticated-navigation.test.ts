import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { findManagedTeamForUser, getAthleteNavigation, getClubNavigation } from '../src/lib/authenticated-navigation';

describe('authenticated player and captain navigation', () => {
  it('builds athlete shortcuts only from routes that exist', () => {
    expect(getAthleteNavigation('eafc26', 'player-7').map((item) => item.href)).toEqual([
      '/eafc26/jugadores/player-7',
      '/atleta/stats',
      '/atleta/ofertas',
      '/mensajes',
      '/eafc26/atleta-ajustes',
    ]);
  });

  it('builds captain shortcuts from the current club routes', () => {
    expect(getClubNavigation('eafc26', 'team-9').map((item) => item.href)).toEqual([
      '/eafc26/equipos/team-9',
      '/club/plantilla',
      '/club/reclutamiento',
      '/club/matchday',
      '/club/ajustes',
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
    expect(mobileNav).toContain('getAthleteNavigation');
    expect(mobileNav).toContain('getClubNavigation');
    expect(topNav).toContain('authenticated-explore-menu');
    expect(topNav).not.toContain('<NavLinks');
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
