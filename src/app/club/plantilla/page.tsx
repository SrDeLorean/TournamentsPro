import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Plantilla del Club | TournamentsPro',
  description: 'Gestión de nómina y atletas de la escuadra.',
};

export default function ClubPlantillaPage() {
  permanentRedirect('/eafc26/club/plantilla');
}
