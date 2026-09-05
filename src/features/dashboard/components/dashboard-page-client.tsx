'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

import { AdminDashboardView } from '@/components/admin/admin-dashboard-view';
import { OrganizerDashboardView } from '@/components/organizer/organizer-dashboard-view';
import { useAuth } from '@/components/providers/auth-provider';
import { AthleteWorkspaceView } from '@/components/workspaces/athlete-workspace-view';
import { ClubWorkspaceView } from '@/components/workspaces/club-workspace-view';

export default function DashboardPage() {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !currentUser) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-heading)]"><div className="flex items-center gap-3"><Sparkles className="size-6 animate-spin text-[var(--app-accent)]" /><span className="text-sm font-extrabold uppercase">Cargando panel eSports...</span></div></div>;
  }

  if (currentUser.role === 'Administrador') return <AdminDashboardView />;
  if (currentUser.role === 'Organizador') return <OrganizerDashboardView />;
  if (currentUser.role === 'Capitán') return <ClubWorkspaceView gameSlug={currentUser.primaryGame} section="resumen" />;
  return <AthleteWorkspaceView gameSlug={currentUser.primaryGame} section="resumen" />;
}
