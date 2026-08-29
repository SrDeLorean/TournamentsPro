import { ClubWorkspaceView } from '@/components/workspaces/club-workspace-view';

export default async function ClubWorkspacePage({ params }: { params: Promise<{ gameSlug: string }> }) {
  const { gameSlug } = await params;
  return <ClubWorkspaceView gameSlug={gameSlug} />;
}
