import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Ajustes del Club | TournamentsPro',
  description: 'Configuración de marca e identidad del club.',
};

export default function ClubAjustesPage() {
  permanentRedirect('/eafc26/club/ajustes');
}
