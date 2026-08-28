import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ModerationDashboard } from '@/components/admin/moderation-dashboard-view';
import { getServerUserSession } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'Moderación & Chat | TournamentsPro',
  description: 'Panel de moderación, control de baneos y chat global',
};

export const dynamic = 'force-dynamic';

export default async function ModeracionPage() {
  const session = await getServerUserSession();
  if (!session) redirect('/?login=required&next=%2Fmoderacion');

  const role = session.role.toLowerCase();
  if (role !== 'administrador' && role !== 'admin') redirect('/dashboard');

  return <ModerationDashboard />;
}
