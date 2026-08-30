import { notFound } from 'next/navigation';
import { ClubWorkspaceView } from '@/components/workspaces/club-workspace-view';
import { CLUB_WORKSPACE_SECTIONS, isClubWorkspaceSection } from '@/lib/workspace-sections';

export const dynamicParams = false;

export function generateStaticParams() {
  return CLUB_WORKSPACE_SECTIONS
    .filter((section) => section !== 'resumen')
    .map((section) => ({ section }));
}

export default async function ClubSectionPage({ params }: { params: Promise<{ gameSlug: string; section: string }> }) {
  const { gameSlug, section } = await params;
  if (!isClubWorkspaceSection(section) || section === 'resumen') notFound();
  return <ClubWorkspaceView gameSlug={gameSlug} section={section} />;
}
