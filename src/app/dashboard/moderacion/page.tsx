import type { Metadata } from 'next';
import { ModerationDashboard } from '@/components/admin/moderation-dashboard-view';
import { requireServerActor } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'Moderación global | TorneosPro',
  description: 'Panel administrativo de moderación, sanciones y chat global.',
};

export const dynamic = 'force-dynamic';

export default async function DashboardModerationPage() {
  await requireServerActor(['Administrador', 'Organizador']);
  return <ModerationDashboard />;
}
