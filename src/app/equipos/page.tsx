import type { Metadata } from 'next';
import GlobalDirectoryPage from '@/components/public/global-directory-page';

export const metadata: Metadata = {
  title: 'Equipos y clubes | TorneosPro',
  description: 'Directorio público de equipos y clubes eSports.',
};

export default function TeamsPage() {
  return <GlobalDirectoryPage kind="teams" />;
}
