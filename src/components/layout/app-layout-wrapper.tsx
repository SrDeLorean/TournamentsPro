'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Navbar } from '@/components/layout/navbar';
import { AdminOrganizerSidebar } from '@/components/layout/admin-organizer-sidebar';
import { Footer } from '@/components/layout/footer';
import { AdminOrganizerHeader } from '@/components/layout/admin-organizer-header';

// Routes where footer should be hidden
const HIDE_FOOTER_PATTERNS = ['/dashboard', '/admin'];

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  const [isManagementMenuOpen, setIsManagementMenuOpen] = React.useState(false);
  
  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdminOrOrganizer = roleStr === 'administrador' || roleStr === 'admin' || roleStr === 'organizador';
  const isManagementRoute = pathname.startsWith('/dashboard');
  const showRoleAwareChrome = isAdminOrOrganizer;

  // Hide footer on admin/dashboard routes
  const shouldHideFooter = HIDE_FOOTER_PATTERNS.some(pattern => pathname.startsWith(pattern));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Managers keep their role-aware navigation on private and public pages. */}
      {showRoleAwareChrome ? (
        <AdminOrganizerHeader
          isManagementRoute={isManagementRoute}
          isMenuOpen={isManagementMenuOpen}
          onMenuToggle={() => setIsManagementMenuOpen((open) => !open)}
        />
      ) : <Navbar />}

      {/* Shared workspace shell. Phones and tablets use the drawer; desktop keeps the rail visible. */}
      <div className="relative flex min-w-0 flex-1">
        {showRoleAwareChrome ? (
          <AdminOrganizerSidebar
            isDocked={isManagementRoute}
            isMobileOpen={isManagementMenuOpen}
            onMobileOpenChange={setIsManagementMenuOpen}
          />
        ) : null}

        <main className={`min-h-screen min-w-0 flex-grow overflow-x-clip transition-[padding] duration-300 w-full page-transition ${showRoleAwareChrome && isManagementRoute ? 'lg:pl-72' : ''}`}>
          {children}
        </main>
      </div>

      {!shouldHideFooter && <Footer />}
    </div>
  );
}
