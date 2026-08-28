import type { Metadata } from 'next';
import TeamsPageClient from '@/features/teams/components/teams-page-client';
import { requireServerActor } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'Gestión de equipos | TorneosPro',
  description: 'Administración global de clubes, escuadras y plantillas.',
};

export const dynamic = 'force-dynamic';

export default async function DashboardTeamsPage() {
  await requireServerActor(['Administrador', 'Organizador']);
  return <TeamsPageClient />;
}
