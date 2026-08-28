import type { Metadata } from 'next';
import GlobalDirectoryPage from '@/components/public/global-directory-page';

export const metadata: Metadata = {
  title: 'Atletas y usuarios | TorneosPro',
  description: 'Directorio público de atletas registrados en TorneosPro.',
};

export default function UsersPage() {
  return <GlobalDirectoryPage kind="users" />;
}
