import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { OrganizationProfileView } from '@/components/tournaments/organization-profile-view';
import { getPublicOrganizationProfile } from '@/features/organizations/lib/public-organization-profile';

export default async function OrganizationPage({ params }: { params: Promise<{ gameSlug: string; orgId: string }> }) {
  const { gameSlug, orgId } = await params;
  const { gameConfig, profile } = await getPublicOrganizationProfile(gameSlug, orgId);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] pb-20 text-[var(--text-primary)]">
        <div className="flex items-center justify-center p-8">
          <div className="space-y-4 text-center">
            <Building2 className="mx-auto size-16 text-[var(--text-muted)] opacity-50" />
            <h1 className="text-2xl font-black uppercase text-[var(--text-heading)]">Organización no encontrada</h1>
            <Link href={`/${gameSlug}/organizaciones`} className="block text-sm font-bold text-[var(--app-accent)] hover:underline">
              Volver al directorio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20 text-[var(--text-primary)]">
      <div className="standard-page-wrapper pt-0">
        <OrganizationProfileView gameSlug={gameSlug} gameConfig={gameConfig} {...profile} />
      </div>
    </div>
  );
}
