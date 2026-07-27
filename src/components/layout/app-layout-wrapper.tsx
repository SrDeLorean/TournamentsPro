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

      {/* Main Flex Wrapper with Joined Left Sidebar for Admin / Organizer */}
      <div className="flex flex-1 relative">
        <AdminOrganizerSidebar />

        <main className={`flex-grow min-h-screen transition-all duration-300 w-full page-transition ${isAdminOrOrganizer ? 'md:pl-64' : ''}`}>
          {children}
        </main>
      </div>

      {!shouldHideFooter && <Footer />}
    </div>
  );
}
