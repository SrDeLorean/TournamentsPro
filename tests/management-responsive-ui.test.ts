import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('management workspace UI', () => {
  it('shares the management primitives across admin and organizer dashboards', async () => {
    const [admin, organizer] = await Promise.all([
      readFile('src/components/admin/admin-dashboard-view.tsx', 'utf8'),
      readFile('src/components/organizer/organizer-dashboard-view.tsx', 'utf8'),
    ]);

    for (const source of [admin, organizer]) {
      expect(source).toContain('<ManagementPage>');
      expect(source).toContain('<MetricCard');
      expect(source).toContain('<ManagementTabs');
    }
  });

  it('uses a drawer through tablet widths and reserves the rail for desktop', async () => {
    const [layout, header, sidebar] = await Promise.all([
      readFile('src/components/layout/app-layout-wrapper.tsx', 'utf8'),
      readFile('src/components/layout/admin-organizer-header.tsx', 'utf8'),
      readFile('src/components/layout/admin-organizer-sidebar.tsx', 'utf8'),
    ]);

    expect(layout).toContain("showRoleAwareChrome && isManagementRoute ? 'lg:pl-72' : ''");
    expect(layout).toContain('showRoleAwareChrome = isAdminOrOrganizer');
    expect(layout).toContain('isDocked={isManagementRoute}');
    expect(layout).not.toContain('pt-[3.25rem]');
    expect(layout).toContain('isManagementMenuOpen');
    expect(header).toContain('aria-controls="management-navigation"');
    expect(header).toContain("isManagementRoute ? 'lg:w-72 lg:border-r' : 'lg:w-auto'");
    expect(header).toContain('management-mode-switch');
    expect(header).toContain('Vista pública');
    expect(header).toContain('href="/cuenta/ajustes"');
    expect(sidebar).toContain('top-14');
    expect(sidebar).not.toContain('top-[6.5rem]');
    expect(sidebar).toContain("isDocked ? 'lg:translate-x-0 lg:shadow-none' : ''");
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

    expect(layout).toContain('<AdminOrganizerHeader');
    expect(layout).not.toContain('<Navbar forcePublic={isAdminOrOrganizer} />');
    expect(proxy).toContain('"/cuenta"');
    expect(account).toContain('<UserProfileSettingsView');
    expect(notifications).toContain('notification-center-panel');
    expect(notifications).toContain('aria-controls="notification-center-panel"');
    expect(styles).toContain('.management-mode-switch');
    expect(styles).toContain('.management-profile-action');
    expect(styles).toContain('.notification-center-item.is-unread');
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

    expect(layout).toContain('<Footer compact={showRoleAwareChrome} />');
    expect(layout).not.toContain("['/dashboard', '/admin']");
    expect(footer).toContain("compact && 'app-footer-management'");
    expect(footer).toContain('aria-label="Navegación del pie de página"');
    expect(styles).toContain('.app-footer-inner');
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
    expect(admin).toContain('<ModalForm');
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
    expect(filterBar).toContain('xl:flex-wrap');
    expect(dataTable).toContain('sm:grid-cols-2');
    expect(dataTable).toContain('xl:flex-row');

    for (const source of [users, teams]) {
      expect(source).toContain('size="xl"');
      expect(source).toContain('flex flex-col gap-3 sm:flex-row');
    }
  });

  it('closes mobile navigation deterministically without leaking body scroll locks', async () => {
    const [layout, navbar, sidebar, modal, scrollLock] = await Promise.all([
      readFile('src/components/layout/app-layout-wrapper.tsx', 'utf8'),
      readFile('src/components/layout/navbar.tsx', 'utf8'),
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
    expect(layout).toContain('<Navbar key={pathname} />');
    expect(navbar).toContain("useBodyScrollLock(isMobileMenuOpen, 'public-navigation')");
    expect(navbar).toContain('closeAtDesktopBreakpoint');
    expect(navbar).toContain("event.key === 'Escape'");
    expect(navbar).toContain('aria-label="Cerrar menú principal"');
    expect(sidebar).toContain("useBodyScrollLock(isMobileOpen, 'management-navigation')");
    expect(sidebar).toContain('closeAtDesktopBreakpoint');
    expect(sidebar).not.toContain('document.body.style.overflow');
  });
});
