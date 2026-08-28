import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Reportar Encuentros & Matchday | TournamentsPro',
  description: 'Módulo de reporte de encuentros, comprobantes y validación de vistos buenos para torneos eSports.',
};

export default function MatchdayPage() {
  permanentRedirect('/dashboard/matchday');
}
