import type { Metadata } from 'next';
import OrganizationsPageClient from '@/features/organizations/components/organizations-page-client';

export const metadata: Metadata = {
  title: 'Gestión de Organizaciones | TorneosPro',
  description: 'Módulo de administración de organizaciones eSports.',
};

export default function DashboardOrganizationsPage() {
  return <OrganizationsPageClient />;
}
