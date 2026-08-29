import { AthleteWorkspaceView } from '@/components/workspaces/athlete-workspace-view';

export default async function AthleteWorkspacePage({ params }: { params: Promise<{ gameSlug: string }> }) {
  const { gameSlug } = await params;
  return <AthleteWorkspaceView gameSlug={gameSlug} />;
}
