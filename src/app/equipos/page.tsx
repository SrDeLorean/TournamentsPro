import type { Metadata } from 'next';
import TeamsPageClient from '@/features/teams/components/teams-page-client';

export const metadata: Metadata = {
  title: 'Equipos y clubes | TorneosPro',
  description: 'Directorio global y administración de equipos y clubes eSports.',
};

export default function TeamsPage() {
  return <TeamsPageClient />;
}
