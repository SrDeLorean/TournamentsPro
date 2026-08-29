'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Navbar } from '@/components/layout/navbar';
import { AdminOrganizerSidebar } from '@/components/layout/admin-organizer-sidebar';
import { Footer } from '@/components/layout/footer';
import { AdminOrganizerHeader } from '@/components/layout/admin-organizer-header';

// Immersive authentication pages intentionally omit the global footer.
const HIDE_FOOTER_PATTERNS = ['/auth'];

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  const [managementMenuState, setManagementMenuState] = React.useState({ pathname, open: false });
  const isManagementMenuOpen = managementMenuState.pathname === pathname && managementMenuState.open;
  const setIsManagementMenuOpen = React.useCallback((open: boolean) => {
    setManagementMenuState({ pathname, open });
  }, [pathname]);
  
  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdminOrOrganizer = roleStr === 'administrador' || roleStr === 'admin' || roleStr === 'organizador';
  const isManagementRoute = pathname.startsWith('/dashboard');
  const showRoleAwareChrome = isAdminOrOrganizer;

  const shouldHideFooter = HIDE_FOOTER_PATTERNS.some(pattern => pathname.startsWith(pattern));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Managers keep their role-aware navigation on private and public pages. */}
      {showRoleAwareChrome ? (
        <AdminOrganizerHeader
          key={`management-header-${pathname}`}
          isManagementRoute={isManagementRoute}
          isMenuOpen={isManagementMenuOpen}
          onMenuToggle={() => setManagementMenuState((current) => ({
            pathname,
            open: current.pathname === pathname ? !current.open : true,
          }))}
        />
      ) : <Navbar key={pathname} />}

      {/* Shared workspace shell. Phones and tablets use the drawer; desktop keeps the rail visible. */}
      <div className="relative flex min-w-0 flex-1">
        {showRoleAwareChrome ? (
          <AdminOrganizerSidebar
            key={`management-sidebar-${pathname}`}
            isDocked={isManagementRoute}
            isMobileOpen={isManagementMenuOpen}
            onMobileOpenChange={setIsManagementMenuOpen}
          />
        ) : null}

        <div className={`flex min-h-screen min-w-0 flex-grow flex-col overflow-x-clip transition-[padding] duration-300 w-full page-transition ${showRoleAwareChrome && isManagementRoute ? 'lg:pl-72' : ''}`}>
          <main className="min-w-0 flex-1">{children}</main>
          {!shouldHideFooter && <Footer compact={showRoleAwareChrome} />}
        </div>
      </div>
    </div>
  );
}
