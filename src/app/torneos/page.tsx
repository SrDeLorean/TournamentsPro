import { PublicPortalOverview } from '@/components/public/public-portal-overview';
import { Badge } from '@/components/ui/badge';
import { getPublicPortalSummary } from '@/lib/public-home-data';

export const revalidate = 60;

export default async function PublicTournamentsPage() {
  const summary = await getPublicPortalSummary();
  return <main className="public-home-page"><section className="public-home-hero"><div className="public-home-hero-glow" /><div className="public-home-hero-copy"><Badge variant="cyan">Circuito competitivo global</Badge><h1>Ligas, resultados y clubes <span>en un solo tablero.</span></h1><p className="public-home-description">Explora la actividad pública de todas las disciplinas y entra al portal especializado para consultar fixtures y clasificaciones.</p></div><div className="public-home-overview"><div><strong>{summary.counts.competitions}</strong><span>Competencias publicadas</span></div><div><strong>{summary.counts.liveMatches}</strong><span>Encuentros activos</span></div><div><strong>{summary.counts.teams}</strong><span>Clubes participantes</span></div></div></section><PublicPortalOverview summary={summary} /></main>;
}
