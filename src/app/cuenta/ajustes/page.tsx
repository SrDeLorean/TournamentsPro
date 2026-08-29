'use client';

import { useRouter } from 'next/navigation';
import { UserProfileSettingsView } from '@/components/user/user-profile-settings-view';
import { useAuth } from '@/components/providers/auth-provider';
import { GAMES_CATALOG } from '@/lib/games-data';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { activeGameSlug } = useAuth();
  const game = GAMES_CATALOG[activeGameSlug] || GAMES_CATALOG.eafc26;

  return (
    <div
      className="min-h-screen bg-[var(--bg-main)] pb-20 text-[var(--text-primary)]"
      style={{ '--game-brand': game.brandColor, '--game-accent': game.accentColor } as React.CSSProperties}
    >
      <UserProfileSettingsView brandColor={game.brandColor} onBack={() => router.push('/dashboard')} />
    </div>
  );
}
