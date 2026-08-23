import React from 'react';
import { MatchdayReportView } from '@/components/matches/matchday-report-view';

export const metadata = {
  title: 'Reportar Encuentros & Matchday | TournamentsPro',
  description: 'Módulo de reporte de encuentros, comprobantes y validación de vistos buenos para torneos eSports.',
};

export default function MatchdayPage() {
  return <MatchdayReportView />;
}
