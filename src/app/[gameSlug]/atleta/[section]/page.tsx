import { notFound } from 'next/navigation';
import { AthleteWorkspaceView } from '@/components/workspaces/athlete-workspace-view';
import { ATHLETE_WORKSPACE_SECTIONS, isAthleteWorkspaceSection } from '@/lib/workspace-sections';

export const dynamicParams = false;

export function generateStaticParams() {
  return ATHLETE_WORKSPACE_SECTIONS
    .filter((section) => section !== 'resumen')
    .map((section) => ({ section }));
}

export default async function AthleteSectionPage({ params }: { params: Promise<{ gameSlug: string; section: string }> }) {
  const { gameSlug, section } = await params;
  if (!isAthleteWorkspaceSection(section) || section === 'resumen') notFound();
  return <AthleteWorkspaceView gameSlug={gameSlug} section={section} />;
}
