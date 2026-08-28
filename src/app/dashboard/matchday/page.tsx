import type { Metadata } from 'next';
import { MatchdayReportView } from '@/components/matches/matchday-report-view';
import { requireServerActor } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'Operación Matchday | TorneosPro',
  description: 'Reporte, revisión y validación de encuentros competitivos.',
};

export const dynamic = 'force-dynamic';

export default async function DashboardMatchdayPage() {
  await requireServerActor(['Administrador', 'Organizador']);
  return <MatchdayReportView />;
}
