import { notFound } from 'next/navigation';
import { ATHLETE_SECTIONS, AthleteWorkspaceView, type AthleteWorkspaceSection } from '@/components/workspaces/athlete-workspace-view';

export default async function AthleteSectionPage({ params }: { params: Promise<{ gameSlug: string; section: string }> }) {
  const { gameSlug, section } = await params;
  if (!ATHLETE_SECTIONS.includes(section as AthleteWorkspaceSection) || section === 'resumen') notFound();
  return <AthleteWorkspaceView gameSlug={gameSlug} section={section as AthleteWorkspaceSection} />;
}
