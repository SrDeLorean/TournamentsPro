import type { Metadata } from 'next';
import DashboardPageClient from '@/features/dashboard/components/dashboard-page-client';

export const metadata: Metadata = { title: 'Panel principal | TorneosPro' };

export default function DashboardPage() {
  return <DashboardPageClient />;
}
