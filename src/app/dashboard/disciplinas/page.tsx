import React from 'react';
import { GamesManagementView } from '@/components/admin/games-management-view';

export const metadata = {
  title: 'Gestión de Disciplinas | TournamentsPro',
  description: 'Panel de administración para gestionar juegos y disciplinas.',
};

export default function DisciplinasPage() {
  return <GamesManagementView />;
}
