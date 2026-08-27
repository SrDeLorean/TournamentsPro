import React from 'react';
import { Metadata } from 'next';
import { ModerationDashboard } from '@/components/admin/moderation-dashboard-view';

export const metadata: Metadata = {
  title: 'Moderación & Chat | TournamentsPro',
  description: 'Panel de moderación, control de baneos y chat global',
};

export default function ModeracionPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <ModerationDashboard />
    </div>
  );
}
