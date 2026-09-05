import { GAMES_CATALOG } from '@/lib/games-data';
import {
  PublicDirectorySection,
  PublicDisciplineSection,
  PublicHomeHero,
  PublicLiveStrip,
} from '@/components/public/public-home-sections';
import { PublicPortalOverview } from '@/components/public/public-portal-overview';
import { getPublicPortalSummary } from '@/lib/public-home-data';

export default async function HomePage() {
  const games = Object.values(GAMES_CATALOG);
  const summary = await getPublicPortalSummary();

  return (
    <main className="public-home-page">
      <PublicLiveStrip matches={summary.matches} />
      <PublicHomeHero summary={summary} gamesCount={games.length} />
      <PublicDirectorySection />
      <PublicPortalOverview summary={summary} />
      <PublicDisciplineSection games={games} />
    </main>
  );
}
