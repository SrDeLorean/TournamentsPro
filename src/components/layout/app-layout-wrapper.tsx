'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Navbar } from '@/components/layout/navbar';
import { AdminOrganizerSidebar } from '@/components/layout/admin-organizer-sidebar';
import { Footer } from '@/components/layout/footer';
import { GAMES_CATALOG } from '@/lib/games-data';

// Immersive authentication pages intentionally omit the global footer.
const HIDE_FOOTER_PATTERNS = ['/auth', '/login', '/registro'];
const PRIVATE_ROUTE_PREFIXES = ['/dashboard', '/mensajes', '/atleta', '/club', '/cuenta'];
const PRIVATE_GAME_ROUTE = /^\/[^/]+\/(?:atleta|club)(?:\/|$)/;
const MANAGEMENT_SIDEBAR_STORAGE_KEY = 'tournamentspro:management-sidebar-collapsed';
const MANAGEMENT_SIDEBAR_CHANGE_EVENT = 'tournamentspro:management-sidebar-change';

function subscribeToManagementSidebarPreference(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(MANAGEMENT_SIDEBAR_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(MANAGEMENT_SIDEBAR_CHANGE_EVENT, onStoreChange);
  };
}

function getManagementSidebarPreference() {
  return window.localStorage.getItem(MANAGEMENT_SIDEBAR_STORAGE_KEY) === 'true';
}

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  const routeGameSlug = pathname.split('/').filter(Boolean)[0];
  const routeGame = GAMES_CATALOG[routeGameSlug];
  const [managementMenuState, setManagementMenuState] = React.useState({ pathname, open: false });
  const isManagementSidebarCollapsed = React.useSyncExternalStore(
    subscribeToManagementSidebarPreference,
    getManagementSidebarPreference,
    () => false,
  );
  const isManagementMenuOpen = managementMenuState.pathname === pathname && managementMenuState.open;
  const setIsManagementMenuOpen = React.useCallback((open: boolean) => {
    setManagementMenuState({ pathname, open });
  }, [pathname]);
  
  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdminOrOrganizer = roleStr === 'administrador' || roleStr === 'admin' || roleStr === 'organizador';
  const showRoleAwareChrome = isAdminOrOrganizer;

  const toggleManagementNavigation = React.useCallback(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      window.localStorage.setItem(
        MANAGEMENT_SIDEBAR_STORAGE_KEY,
        String(!isManagementSidebarCollapsed),
      );
      window.dispatchEvent(new Event(MANAGEMENT_SIDEBAR_CHANGE_EVENT));
      return;
    }

    setManagementMenuState((current) => ({
      pathname,
      open: current.pathname === pathname ? !current.open : true,
    }));
  }, [isManagementSidebarCollapsed, pathname]);

  const shouldHideFooter = HIDE_FOOTER_PATTERNS.some(pattern => pathname.startsWith(pattern));
  const isPublicRoute = !PRIVATE_GAME_ROUTE.test(pathname)
    && !PRIVATE_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

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
          <main className={`${isPublicRoute ? 'public-route-surface' : ''} min-w-0 flex-1`}>{children}</main>
          {!shouldHideFooter && <Footer compact={showRoleAwareChrome} brandColor={routeGame?.brandColor} />}
        </div>
      </div>
    </div>
  );
}
