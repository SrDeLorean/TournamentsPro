import { readdir, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { isNavigationItemActive } from '../src/components/layout/management-navigation-model';

async function collectSourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory()) return collectSourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

describe('management workspace UI', () => {
  it('keeps dashboard color and font decisions inside semantic CSS and UI tokens', async () => {
    const visualRoots = [
      'src/app/dashboard',
      'src/components/admin',
      'src/components/organizer',
      'src/components/dashboard',
      'src/components/layout',
      'src/components/ui',
      'src/components/teams',
      'src/components/players',
      'src/components/matches',
      'src/components/tournaments',
      'src/components/transfers',
      'src/components/chat',
      'src/components/notifications',
      'src/features/dashboard',
      'src/features/organizations',
      'src/features/users',
      'src/features/teams',
      'src/features/competitions',
    ];
    const visualFiles = (await Promise.all(visualRoots.map(collectSourceFiles))).flat();
    const sources = await Promise.all(visualFiles.map(async (file) => ({
      file,
      source: await readFile(file, 'utf8'),
    })));
    const legacyColorClass = /(?:text|bg|border|from|via|to|ring|shadow|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-[0-9]+)?(?:\/[0-9]+)?/;
    const legacyColorToken = /var\(--accent-(?:cyan|violet|emerald|gold|crimson|success|warning|info)(?:-bg|-hover)?\)/;
    const literalColor = /#[0-9a-f]{3,8}\b/i;
    const fixedFontFamily = /\bfont-(?:mono|sans|serif|display|outfit|jakarta|sora|inter)\b/;

    const offenders = sources.filter(({ source }) => (
      legacyColorClass.test(source)
      || legacyColorToken.test(source)
      || literalColor.test(source)
      || fixedFontFamily.test(source)
    )).map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  it('transfers the final design-system contract to every dashboard route', async () => {
    const [layout, managementUi, organizer, organizerHero, organizerModel, styles] = await Promise.all([
      readFile('src/app/dashboard/layout.tsx', 'utf8'),
      readFile('src/components/dashboard/management-ui.tsx', 'utf8'),
      readFile('src/components/organizer/organizer-dashboard-view.tsx', 'utf8'),
      readFile('src/components/organizer/organizer-dashboard-hero.tsx', 'utf8'),
      readFile('src/components/organizer/organizer-dashboard-model.ts', 'utf8'),
      readFile('src/app/globals.css', 'utf8'),
    ]);

    expect(layout).toContain('dashboard-route-surface');
    expect(layout).toContain('dashboard-route-content');
    expect(managementUi).toContain("cyan: { accent: 'var(--app-accent)'");
    expect(managementUi).toContain("violet: { accent: 'var(--app-accent-2)'");
    expect(managementUi).toContain("emerald: { accent: 'var(--app-positive)'");
    expect(managementUi).toContain("gold: { accent: 'var(--app-warning)'");
    expect(managementUi).toContain("crimson: { accent: 'var(--app-danger)'");
    expect(managementUi).toContain('management-hero-grid');
    expect(styles).toContain('.dashboard-route-surface');
    expect(styles).toContain('.management-page::before');
    expect(styles).toContain('font-family: var(--font-active');
    expect(styles).toContain('content-visibility: auto');

    expect(organizer).toContain('<OrganizerDashboardHero');
    expect(organizer).not.toContain('activeGame.brandColor');
    expect(organizer).not.toMatch(/brandColor="var\(--app-(?:positive|warning)\)"/);
    expect(organizer).not.toContain('Header Banner with Organization Identity');
    expect(organizer.split(/\r?\n/).length).toBeLessThan(525);
    expect(organizerHero).toContain('<ManagementHero');
    expect(organizerHero).not.toContain('game.brandColor');
    expect(organizerModel).toContain('export { GAME_MODES }');
  });

  it('shares the management primitives across admin and organizer dashboards', async () => {
    const [admin, organizer] = await Promise.all([
      readFile('src/components/admin/admin-dashboard-view.tsx', 'utf8'),
      readFile('src/components/organizer/organizer-dashboard-view.tsx', 'utf8'),
    ]);

    for (const source of [admin, organizer]) {
      expect(source).toContain('<ManagementPage>');
      expect(source).toMatch(/<(?:MetricCard|DashboardInsightMetrics)/);
      expect(source).toContain('<ManagementTabs');
      expect(source).not.toMatch(/brandColor="var\(--app-(?:positive|warning)\)"/);
    }
  });

  it('keeps the manager rail visible on desktop until the user collapses it', async () => {
    const [layout, navbar, sidebar] = await Promise.all([
      readFile('src/components/layout/app-layout-wrapper.tsx', 'utf8'),
      readFile('src/components/layout/navbar.tsx', 'utf8'),
      readFile('src/components/layout/admin-organizer-sidebar.tsx', 'utf8'),
    ]);

    expect(layout).toContain("MANAGEMENT_SIDEBAR_STORAGE_KEY");
    expect(layout).toContain("showRoleAwareChrome && !isManagementSidebarCollapsed ? 'lg:pl-72' : ''");
    expect(layout).toContain('showRoleAwareChrome = isAdminOrOrganizer');
    expect(layout).toContain('isDesktopCollapsed={isManagementSidebarCollapsed}');
    expect(layout).not.toContain('pt-[3.25rem]');
    expect(layout).toContain('isManagementMenuOpen');
    expect(layout).toContain('<Navbar');
    expect(layout).toContain('forcePublic');
    expect(layout).toContain('managementNavigation=');
    expect(navbar).toContain('aria-controls="management-navigation"');
    expect(navbar).toContain('aria-controls="public-mobile-navigation"');
    expect(sidebar).toContain('top-14');
    expect(sidebar).not.toContain('top-[6.5rem]');
    expect(sidebar).toContain("isDesktopCollapsed ? 'lg:-translate-x-full' : 'lg:translate-x-0 lg:shadow-none'");
    expect(sidebar).toContain("event.key === 'Escape'");
    expect(sidebar).toContain('organizerNavItems');
  });

  it('preserves public content while keeping role-aware manager navigation', async () => {
    const [layout, proxy, account, notifications, styles] = await Promise.all([
      readFile('src/components/layout/app-layout-wrapper.tsx', 'utf8'),
      readFile('src/proxy.ts', 'utf8'),
      readFile('src/app/cuenta/ajustes/page.tsx', 'utf8'),
      readFile('src/components/notifications/notification-center.tsx', 'utf8'),
      readFile('src/app/globals.css', 'utf8'),
    ]);

    expect(layout).not.toContain('<AdminOrganizerHeader');
    expect(layout).toContain('forcePublic={showRoleAwareChrome}');
    expect(proxy).toContain('"/cuenta"');
    expect(account).toContain('<UserProfileSettingsView');
    expect(notifications).toContain('notification-center-panel');
    expect(notifications).toContain('aria-controls="notification-center-panel"');
    expect(styles).toContain('.management-mode-switch');
    expect(styles).toContain('.management-profile-action');
    expect(styles).toContain('.notification-center-item.is-unread');
  });

  it('shows public routes in the player desktop header and keeps mobile menus separated', async () => {
    const [playerNavbar, publicNavbar, sidebar] = await Promise.all([
      readFile('src/components/layout/admin-navbar.tsx', 'utf8'),
      readFile('src/components/layout/navbar.tsx', 'utf8'),
      readFile('src/components/layout/admin-organizer-sidebar.tsx', 'utf8'),
    ]);

    expect(playerNavbar).toContain('<NavLinks />');
    expect(playerNavbar).toContain('authenticated-global-menu relative flex-shrink-0 xl:hidden');
    expect(playerNavbar).toContain('max-w-[96rem]');
    expect(publicNavbar).toContain('Abrir navegación global');
    expect(publicNavbar).toContain('Abrir panel de gestión');
    expect(sidebar).toContain('management-public-shortcuts hidden space-y-2');
    expect(sidebar).toContain('lg:block');
  });

  it('renders table cells with labels for the phone card layout', async () => {
    const table = await readFile('src/components/ui/data-table.tsx', 'utf8');
    const styles = await readFile('src/app/globals.css', 'utf8');

    expect(table).toContain('ui-data-table-responsive');
    expect(table).toContain('data-label={col.header}');
    expect(table).toContain('data-row-number=');
    expect(table).toContain("'--data-table-accent': brandColor");
    expect(styles).toContain('.ui-data-table-responsive tbody td::before');
    expect(styles).toContain('.ui-data-table-responsive tbody tr::before');
    expect(styles).toContain('.ui-data-table-heading');
  });

  it('keeps a compact responsive footer inside public and management content columns', async () => {
    const [layout, footer, styles] = await Promise.all([
      readFile('src/components/layout/app-layout-wrapper.tsx', 'utf8'),
      readFile('src/components/layout/footer.tsx', 'utf8'),
      readFile('src/app/globals.css', 'utf8'),
    ]);

    expect(layout).toMatch(/<Footer compact=\{showRoleAwareChrome\}(?:\s+brandColor=\{[^}]+\})?\s*\/>/);
    expect(layout).not.toContain('key={`management-header-${pathname}`}');
    expect(layout).not.toContain('<Navbar key={pathname} />');
    expect(layout).not.toContain("['/dashboard', '/admin']");
    expect(footer).toContain('if (compact)');
    expect(footer).toContain('app-footer app-footer-management');
    expect(footer).toContain('aria-label="Enlaces rápidos de administración"');
    expect(footer).toContain('Misión y Visión');
    expect(footer).toContain('Quiénes Somos');
    expect(footer).not.toContain("label: 'Equipos'");
    expect(footer).not.toContain("label: 'Jugadores'");
    expect(styles).toContain('.app-footer-main');
    expect(styles).toContain('.app-footer-management');
  });

  it('integrates moderation with the shared workspace and real server actions', async () => {
    const [moderation, proxy, chat] = await Promise.all([
      readFile('src/components/admin/moderation-dashboard-view.tsx', 'utf8'),
      readFile('src/proxy.ts', 'utf8'),
      readFile('src/components/chat/chat-system.tsx', 'utf8'),
    ]);

    expect(moderation).toContain('<ManagementPage>');
    expect(moderation).toContain('getUsersByRoleAction');
    expect(moderation).toContain('banUserFromChatAction');
    expect(moderation).toContain('<CrudAlertBanner');
    expect(moderation).toContain('<ConfirmModal');
    expect(moderation).not.toContain('Dummy data');
    expect(proxy).toContain('"/dashboard"');
    expect(chat).toContain('isMobileConversationOpen');
    expect(chat).toContain('Volver a conversaciones');
  });

  it('routes organizer mutations through shared confirmation and notification UI', async () => {
    const organizer = await readFile('src/components/organizer/organizer-dashboard-view.tsx', 'utf8');

    expect(organizer).toContain('<CrudAlertBanner');
    expect(organizer).toContain('<ConfirmModal');
    expect(organizer).toContain('<ManagementSection');
    expect(organizer).not.toContain('actionMsg');
    expect(organizer).not.toMatch(/\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/);
  });

  it('uses the shared management shell in every global management module', async () => {
    const moduleFiles = [
      'src/features/organizations/components/organizations-page-client.tsx',
      'src/components/admin/games-management-view.tsx',
      'src/app/dashboard/competencias/competitions-client.tsx',
      'src/features/users/components/users-page-client.tsx',
      'src/features/teams/components/teams-page-client.tsx',
      'src/components/matches/matchday-report-view.tsx',
    ];
    const modules = await Promise.all(moduleFiles.map((file) => readFile(file, 'utf8')));

    for (const source of modules) {
      expect(source).toContain('<ManagementPage');
      expect(source).toContain('<ManagementHero');
      expect(source).toContain('<ManagementMetrics');
      expect(source).toContain('<MetricCard');
      expect(source).not.toContain('<PageHeader');
    }
  });

  it('centralizes management surfaces and modal controls in theme-aware CSS', async () => {
    const [managementUi, modal, styles, matchday] = await Promise.all([
      readFile('src/components/dashboard/management-ui.tsx', 'utf8'),
      readFile('src/components/ui/modal-form.tsx', 'utf8'),
      readFile('src/app/globals.css', 'utf8'),
      readFile('src/components/matches/matchday-report-view.tsx', 'utf8'),
    ]);

    expect(managementUi).toContain("'management-page'");
    expect(managementUi).toContain("'management-metrics'");
    expect(managementUi).toContain("'management-toolbar'");
    expect(styles).toContain('.management-hero-main');
    expect(styles).toContain('.management-grid');
    expect(styles).toContain('.ui-modal-form-body');
    expect(modal).toContain('ui-modal-form-body');
    expect(matchday).toContain('<FilterBar');
    expect(matchday).toContain('<MatchdayMatchCard');
    expect(matchday).toContain('matchday-match-grid');
    expect(matchday).not.toContain('ui-data-table-responsive');
  });

  it('uses reusable responsive cards for matchday encounters', async () => {
    const [view, card, styles] = await Promise.all([
      readFile('src/components/matches/matchday-report-view.tsx', 'utf8'),
      readFile('src/components/matches/matchday-match-card.tsx', 'utf8'),
      readFile('src/app/globals.css', 'utf8'),
    ]);

    expect(view).toContain('useDeferredValue');
    expect(view).toContain('renderAsSelect');
    expect(card).toContain('export function MatchdayMatchCard');
    expect(card).toContain("data-status={match.status}");
    expect(card).toContain('onOpenTimezone');
    expect(styles).toContain('.matchday-filter-extras');
    expect(styles).toContain('.matchday-match-card');
    expect(styles).toContain('@media (max-width: 639px)');
  });

  it('standardizes tables, destructive confirmations and CRUD notifications', async () => {
    const [table, modal, confirmation, notification, organizations, disciplines, competitions, styles] = await Promise.all([
      readFile('src/components/ui/data-table.tsx', 'utf8'),
      readFile('src/components/ui/modal.tsx', 'utf8'),
      readFile('src/components/ui/confirm-modal.tsx', 'utf8'),
      readFile('src/components/ui/crud-alert.tsx', 'utf8'),
      readFile('src/features/organizations/components/organizations-page-client.tsx', 'utf8'),
      readFile('src/components/admin/games-management-view.tsx', 'utf8'),
      readFile('src/app/dashboard/competencias/competitions-client.tsx', 'utf8'),
      readFile('src/app/globals.css', 'utf8'),
    ]);

    expect(table).toContain('aria-sort=');
    expect(table).toContain('Restablecer');
    expect(table).toContain('Sin resultados');
    expect(modal).toContain('createPortal');
    expect(modal).toContain("e.key !== 'Tab'");
    expect(confirmation).toContain('confirmationText');
    expect(confirmation).toContain('consequences');
    expect(notification).toContain("aria-live=");
    expect(notification).toContain('durationMs');
    expect(styles).toContain('.ui-data-table-shell');
    expect(styles).toContain('.ui-confirm-modal');

    for (const source of [organizations, disciplines, competitions]) {
      expect(source).toContain('<ConfirmModal');
      expect(source).not.toMatch(/\b(?:window\.)?confirm\s*\(/);
    }
  });

  it('keeps the organizer competition workspace inside the shared management system', async () => {
    const [page, tabs, fixture, schedule, classification, styles] = await Promise.all([
      readFile('src/features/competitions/pages/competition-detail-page.tsx', 'utf8'),
      readFile('src/app/dashboard/competencias/[id]/competition-tabs.tsx', 'utf8'),
      readFile('src/app/dashboard/competencias/[id]/fixture-generator.tsx', 'utf8'),
      readFile('src/components/tournaments/fixture-schedule-view.tsx', 'utf8'),
      readFile('src/components/tournaments/classification-view.tsx', 'utf8'),
      readFile('src/app/globals.css', 'utf8'),
    ]);

    expect(page).toContain('className="management-page"');
    expect(tabs).toContain('<ManagementHero');
    expect(tabs).toContain('<ManagementMetrics>');
    expect(tabs).toContain('<ManagementTabs');
    expect(tabs).toContain('<DataTable');
    expect(tabs).toContain('<ConfirmModal');
    expect(tabs).not.toMatch(/\b(?:window\.)?confirm\s*\(/);
    expect(fixture).toContain('competition-fixture-generator');
    expect(schedule).toContain('fixture-schedule-view');
    expect(classification).toContain('classification-view');
    expect(styles).toContain('.competition-overview-grid');
    expect(styles).toContain('.competition-enrollment-control');
  });

  it('routes CRUD dialogs and feedback through the shared portal system', async () => {
    const [modal, form, confirmation, notification, admin, games, styles] = await Promise.all([
      readFile('src/components/ui/modal.tsx', 'utf8'),
      readFile('src/components/ui/modal-form.tsx', 'utf8'),
      readFile('src/components/ui/confirm-modal.tsx', 'utf8'),
      readFile('src/components/ui/crud-alert.tsx', 'utf8'),
      readFile('src/components/admin/admin-dashboard-view.tsx', 'utf8'),
      readFile('src/components/admin/games-management-view.tsx', 'utf8'),
      readFile('src/app/globals.css', 'utf8'),
    ]);

    expect(modal).toContain('modalSizes');
    expect(modal).toContain('ui-modal-layer');
    expect(modal).toContain('closeDisabled');
    expect(form).toContain('ui-modal-form-content');
    expect(form).toContain("size = 'lg'");
    expect(confirmation).toContain('requireReason');
    expect(notification).toContain('createPortal');
    expect(notification).toContain('runOperation');
    expect(styles).toContain('.ui-crud-alert { z-index: 100100; }');

    expect(admin).toContain('<ConfirmModal');
    expect(admin).toContain('<CreateOrganizationModal');
    expect(admin).toContain('requireReason={!banTarget.isBanned}');
    expect(games).toContain('<ModalForm');

    for (const source of [admin, games]) {
      expect(source).not.toMatch(/\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/);
    }
  });

  it('migrates legacy management dialogs to the reusable modal portal', async () => {
    const modalFiles = [
      'src/components/teams/athlete-management-modal.tsx',
      'src/components/teams/club-management-modal.tsx',
      'src/components/teams/create-team-modal.tsx',
      'src/components/teams/squad-roster-modal.tsx',
      'src/components/teams/team-management-modal.tsx',
      'src/components/transfers/organizer-transfer-review-modal.tsx',
      'src/components/transfers/transfer-market.tsx',
      'src/components/matches/match-report-modal.tsx',
      'src/components/matches/matchday-report-view.tsx',
      'src/components/tournaments/fixture-schedule-view.tsx',
      'src/app/dashboard/competencias/[id]/regenerate-warning-modal.tsx',
      'src/components/chat/chat-system.tsx',
    ];
    const sources = await Promise.all(modalFiles.map((file) => readFile(file, 'utf8')));

    for (const source of sources) {
      expect(source).toContain('<Modal');
      expect(source).not.toMatch(/<div className="fixed inset-0 z-50/);
    }
  });

  it('keeps long CRUD forms scrollable and user/team controls responsive', async () => {
    const [modal, modalForm, filterBar, dataTable, users, teams, styles] = await Promise.all([
      readFile('src/components/ui/modal.tsx', 'utf8'),
      readFile('src/components/ui/modal-form.tsx', 'utf8'),
      readFile('src/components/ui/filter-bar.tsx', 'utf8'),
      readFile('src/components/ui/data-table.tsx', 'utf8'),
      readFile('src/features/users/components/users-page-client.tsx', 'utf8'),
      readFile('src/features/teams/components/teams-page-client.tsx', 'utf8'),
      readFile('src/app/globals.css', 'utf8'),
    ]);

    expect(modal).toContain('ui-modal-content min-h-0');
    expect(modalForm).toContain('ui-modal-form-content');
    expect(styles).toContain('.ui-modal-form > .ui-modal-content');
    expect(styles).toContain('touch-action: pan-y');
    expect(styles).toContain('-webkit-overflow-scrolling: touch');
    expect(filterBar).toContain('ui-filter-options-group');
    expect(styles).toContain('.ui-filter-bar');
    expect(dataTable).toContain('sm:grid-cols-2');
    expect(dataTable).toContain('xl:flex-row');

    for (const source of [users, teams]) {
      expect(source).toContain('size="xl"');
      expect(source).toContain('flex flex-col gap-3 sm:flex-row');
    }
  });

  it('closes mobile navigation deterministically without leaking body scroll locks', async () => {
    const [layout, navbar, mobileNavigation, sidebar, modal, scrollLock] = await Promise.all([
      readFile('src/components/layout/app-layout-wrapper.tsx', 'utf8'),
      readFile('src/components/layout/navbar.tsx', 'utf8'),
      readFile('src/components/layout/mobile-public-navigation.tsx', 'utf8'),
      readFile('src/components/layout/admin-organizer-sidebar.tsx', 'utf8'),
      readFile('src/components/ui/modal.tsx', 'utf8'),
      readFile('src/hooks/use-body-scroll-lock.ts', 'utf8'),
    ]);

    expect(scrollLock).toContain('const activeOwners = new Set<string>()');
    expect(scrollLock).toContain('acquireBodyScrollLock(owner)');
    expect(scrollLock).toContain('releaseBodyScrollLock(owner)');
    expect(scrollLock).toContain("delete document.body.dataset.scrollLocked");
    expect(modal).toContain("useBodyScrollLock(isOpen, 'modal')");

    expect(layout).toContain('managementMenuState.pathname === pathname');
    expect(layout).toContain('<Navbar');
    expect(layout).not.toContain('<Navbar key={pathname} />');
    expect(navbar).toContain('mobileMenuState.pathname === pathname');
    expect(navbar).toContain("useBodyScrollLock(isMobileMenuOpen, 'public-navigation')");
    expect(navbar).toContain('closeAtDesktopBreakpoint');
    expect(navbar).toContain("event.key === 'Escape'");
    expect(navbar).toContain('<MobilePublicNavigation');
    expect(mobileNavigation).toContain('aria-label="Cerrar menú principal"');
    expect(sidebar).toContain("useBodyScrollLock(isMobileOpen, 'management-navigation')");
    expect(sidebar).toContain('closeAtDesktopBreakpoint');
    expect(sidebar).not.toContain('document.body.style.overflow');
  });

  it('matches discipline and dashboard navigation items accurately without sticking on Portada or Dashboard root', () => {
    // Portada should only match when exactly on the discipline root
    expect(isNavigationItemActive('/valorant', '/valorant')).toBe(true);
    expect(isNavigationItemActive('/valorant/', '/valorant')).toBe(true);
    expect(isNavigationItemActive('/valorant/organizaciones', '/valorant')).toBe(false);
    expect(isNavigationItemActive('/valorant/competencias', '/valorant')).toBe(false);
    expect(isNavigationItemActive('/valorant/equipos', '/valorant')).toBe(false);

    // Discipline subpages match their own links and nested paths
    expect(isNavigationItemActive('/valorant/organizaciones', '/valorant/organizaciones')).toBe(true);
    expect(isNavigationItemActive('/valorant/organizaciones/org-123', '/valorant/organizaciones')).toBe(true);
    expect(isNavigationItemActive('/valorant/competencias', '/valorant/organizaciones')).toBe(false);

    // Dashboard root should only match exactly
    expect(isNavigationItemActive('/dashboard', '/dashboard')).toBe(true);
    expect(isNavigationItemActive('/dashboard/organizaciones', '/dashboard')).toBe(false);
    expect(isNavigationItemActive('/dashboard/organizaciones', '/dashboard/organizaciones')).toBe(true);
  });
});
