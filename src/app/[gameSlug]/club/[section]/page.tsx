import { notFound } from 'next/navigation';
import { CLUB_SECTIONS, ClubWorkspaceView, type ClubWorkspaceSection } from '@/components/workspaces/club-workspace-view';

export default async function ClubSectionPage({ params }: { params: Promise<{ gameSlug: string; section: string }> }) {
  const { gameSlug, section } = await params;
  if (!CLUB_SECTIONS.includes(section as ClubWorkspaceSection) || section === 'resumen') notFound();
  return <ClubWorkspaceView gameSlug={gameSlug} section={section as ClubWorkspaceSection} />;
}
