import type { Metadata } from 'next';
import GlobalDirectoryPage from '@/components/public/global-directory-page';

export const metadata: Metadata = {
  title: 'Organizaciones | TorneosPro',
  description: 'Directorio público de organizaciones y comunidades eSports.',
};

export default function OrganizationsPage() {
  return <GlobalDirectoryPage kind="organizations" />;
}
