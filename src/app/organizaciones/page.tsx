import type { Metadata } from 'next';
import OrganizationsPageClient from '@/features/organizations/components/organizations-page-client';

export const metadata: Metadata = {
  title: 'Organizaciones | TorneosPro',
  description: 'Directorio y administración de organizaciones eSports.',
};

export default function OrganizationsPage() {
  return <OrganizationsPageClient />;
}
