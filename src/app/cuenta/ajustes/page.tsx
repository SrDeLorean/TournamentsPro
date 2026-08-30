'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserProfileSettingsView } from '@/components/user/user-profile-settings-view';
import { useAuth } from '@/components/providers/auth-provider';
import { GAMES_CATALOG } from '@/lib/games-data';
import { ManagementHero, ManagementPage } from '@/components/dashboard/management-ui';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Settings } from 'lucide-react';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { activeGameSlug, currentUser } = useAuth();
  const game = GAMES_CATALOG[activeGameSlug] || GAMES_CATALOG.eafc26;

  return (
    <div
      className="account-settings-shell min-h-screen bg-[var(--bg-main)] pb-20 text-[var(--text-primary)]"
      style={{ '--game-brand': game.brandColor, '--game-accent': game.accentColor } as React.CSSProperties}
    >
      <ManagementPage className="context-workspace account-settings-page">
        <ManagementHero
          eyebrow="Identidad, seguridad y preferencias"
          title="Configuración de la cuenta"
          description="Mantén actualizada tu ficha competitiva, credenciales, disciplinas y canales de contacto desde un único espacio."
          icon={Settings}
          tone="cyan"
          badge={game.name}
          actions={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="size-4" />Volver</Button>
              {currentUser?.id ? <Link href={`/${game.slug}/jugadores/${currentUser.id}`}><Button variant="outline" className="w-full"><Eye className="size-4" />Ver ficha pública</Button></Link> : null}
            </div>
          }
        >
          <div className="context-workspace-identity">
            <Avatar fallback={currentUser?.name || 'Atleta'} src={currentUser?.foto || currentUser?.avatarUrl} status="online" size="lg" />
            <div>
              <strong>{currentUser?.name || 'Cuenta de atleta'}</strong>
              <span>@{currentUser?.gamertag || 'usuario'} · {currentUser?.platform || 'Crossplay'}</span>
            </div>
            <Badge variant="cyan">{currentUser?.role || 'Jugador'}</Badge>
          </div>
        </ManagementHero>
        <UserProfileSettingsView brandColor={game.brandColor} embedded />
      </ManagementPage>
    </div>
  );
}
