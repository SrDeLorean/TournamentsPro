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
    const [layout, sidebar] = await Promise.all([
      readFile('src/components/layout/app-layout-wrapper.tsx', 'utf8'),
      readFile('src/components/layout/admin-organizer-sidebar.tsx', 'utf8'),
    ]);

    expect(layout).toContain('lg:pl-72');
    expect(layout).toContain('pt-[3.25rem]');
    expect(sidebar).toContain('lg:hidden');
    expect(sidebar).toContain('lg:translate-x-0');
    expect(sidebar).toContain('organizerNavItems');
  });

  it('renders table cells with labels for the phone card layout', async () => {
    const table = await readFile('src/components/ui/data-table.tsx', 'utf8');
    const styles = await readFile('src/app/globals.css', 'utf8');

    expect(table).toContain('ui-data-table-responsive');
    expect(table).toContain('data-label={col.header}');
    expect(styles).toContain('.ui-data-table-responsive tbody td::before');
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
    expect(moderation).not.toContain('Dummy data');
    expect(proxy).toContain('"/dashboard"');
    expect(chat).toContain('isMobileConversationOpen');
    expect(chat).toContain('Volver a conversaciones');
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
    expect(matchday).toContain('data-label="Enfrentamiento"');
    expect(matchday).toContain('ui-data-table-responsive');
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
});
