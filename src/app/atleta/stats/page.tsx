import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Estadísticas del Atleta | TournamentsPro',
  description: 'Rendimiento y analítica de partidos oficiales.',
};

export default function AtletaStatsPage() {
  permanentRedirect('/eafc26/atleta/estadisticas');
}
