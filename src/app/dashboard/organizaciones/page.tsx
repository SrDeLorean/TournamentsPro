import type { Metadata } from 'next';
import OrganizationsPageClient from '@/features/organizations/components/organizations-page-client';
import { requireServerActor } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'Gestión de Organizaciones | TorneosPro',
  description: 'Módulo de administración de organizaciones eSports.',
};

export const dynamic = 'force-dynamic';

export default async function DashboardOrganizationsPage() {
  await requireServerActor(['Administrador', 'Organizador']);
  return <OrganizationsPageClient />;
}
