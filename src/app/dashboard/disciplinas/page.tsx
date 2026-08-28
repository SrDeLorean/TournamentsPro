import React from 'react';
import { GamesManagementView } from '@/components/admin/games-management-view';
import { requireServerActor } from '@/lib/auth-server';

export const metadata = {
  title: 'Gestión de Disciplinas | TournamentsPro',
  description: 'Panel de administración para gestionar juegos y disciplinas.',
};

export const dynamic = 'force-dynamic';

export default async function DisciplinasPage() {
  await requireServerActor(['Administrador']);
  return <GamesManagementView />;
}
