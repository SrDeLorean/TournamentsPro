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
  
  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdminOrOrganizer = roleStr === 'administrador' || roleStr === 'admin' || roleStr === 'organizador';

  // Hide footer on admin/dashboard routes
  const shouldHideFooter = HIDE_FOOTER_PATTERNS.some(pattern => pathname.startsWith(pattern));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Render dedicated minimal header for Admin/Organizer, or original Navbar for Players */}
      {isAdminOrOrganizer ? <AdminOrganizerHeader /> : <Navbar />}

      {/* Shared workspace shell. Phones and tablets use the drawer; desktop keeps the rail visible. */}
      <div className="relative flex min-w-0 flex-1">
        <AdminOrganizerSidebar />

        <main className={`min-h-screen min-w-0 flex-grow overflow-x-clip transition-[padding] duration-300 w-full page-transition ${isAdminOrOrganizer ? 'pt-[3.25rem] lg:pl-72 lg:pt-0' : ''}`}>
          {children}
        </main>
      </div>

      {!shouldHideFooter && <Footer />}
    </div>
  );
}
