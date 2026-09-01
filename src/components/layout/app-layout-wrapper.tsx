'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Navbar } from '@/components/layout/navbar';
import { AdminOrganizerSidebar } from '@/components/layout/admin-organizer-sidebar';
import { Footer } from '@/components/layout/footer';

// Immersive authentication pages intentionally omit the global footer.
const HIDE_FOOTER_PATTERNS = ['/auth'];
const MANAGEMENT_SIDEBAR_STORAGE_KEY = 'tournamentspro:management-sidebar-collapsed';

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  const [managementMenuState, setManagementMenuState] = React.useState({ pathname, open: false });
  const [isManagementSidebarCollapsed, setIsManagementSidebarCollapsed] = React.useState(false);
  const isManagementMenuOpen = managementMenuState.pathname === pathname && managementMenuState.open;
  const setIsManagementMenuOpen = React.useCallback((open: boolean) => {
    setManagementMenuState({ pathname, open });
  }, [pathname]);
  
  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdminOrOrganizer = roleStr === 'administrador' || roleStr === 'admin' || roleStr === 'organizador';
  const showRoleAwareChrome = isAdminOrOrganizer;

  React.useEffect(() => {
    setIsManagementSidebarCollapsed(
      window.localStorage.getItem(MANAGEMENT_SIDEBAR_STORAGE_KEY) === 'true',
    );
  }, []);

  const toggleManagementNavigation = React.useCallback(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setIsManagementSidebarCollapsed((collapsed) => {
        const next = !collapsed;
        window.localStorage.setItem(MANAGEMENT_SIDEBAR_STORAGE_KEY, String(next));
        return next;
      });
      return;
    }

    setManagementMenuState((current) => ({
      pathname,
      open: current.pathname === pathname ? !current.open : true,
    }));
  }, [pathname]);

  const shouldHideFooter = HIDE_FOOTER_PATTERNS.some(pattern => pathname.startsWith(pattern));

  return (
    <div className="flex flex-col min-h-screen">
      {/* The public header stays identical for visitors and managers. Management gets one extra rail control. */}
      <Navbar
        forcePublic={showRoleAwareChrome}
        managementNavigation={showRoleAwareChrome ? {
          isMobileOpen: isManagementMenuOpen,
          isDesktopCollapsed: isManagementSidebarCollapsed,
          onToggle: toggleManagementNavigation,
        } : undefined}
      />

      {/* Shared workspace shell. Phones and tablets use the drawer; desktop keeps the rail visible. */}
      <div className="relative flex min-w-0 flex-1">
        {showRoleAwareChrome ? (
          <AdminOrganizerSidebar
            isMobileOpen={isManagementMenuOpen}
            isDesktopCollapsed={isManagementSidebarCollapsed}
            onMobileOpenChange={setIsManagementMenuOpen}
          />
        ) : null}

        <div className={`flex min-h-screen min-w-0 flex-grow flex-col overflow-x-clip transition-[padding] duration-300 w-full page-transition ${showRoleAwareChrome && !isManagementSidebarCollapsed ? 'lg:pl-72' : ''}`}>
          <main className="min-w-0 flex-1">{children}</main>
          {!shouldHideFooter && <Footer compact={showRoleAwareChrome} />}
        </div>
      </div>
    </div>
  );
}
