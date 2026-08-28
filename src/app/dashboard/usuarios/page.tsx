import type { Metadata } from 'next';
import UsersPageClient from '@/features/users/components/users-page-client';
import { requireServerActor } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'Gestión de usuarios | TorneosPro',
  description: 'Administración global de usuarios y atletas.',
};

export const dynamic = 'force-dynamic';

export default async function DashboardUsersPage() {
  await requireServerActor(['Administrador', 'Organizador']);
  return <UsersPageClient />;
}
