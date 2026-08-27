import type { Metadata } from 'next';
import UsersPageClient from '@/features/users/components/users-page-client';

export const metadata: Metadata = {
  title: 'Atletas y usuarios | TorneosPro',
  description: 'Directorio y gestión de atletas registrados en TorneosPro.',
};

export default function UsersPage() {
  return <UsersPageClient />;
}
