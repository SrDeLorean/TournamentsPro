import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Mi Ficha de Atleta | TournamentsPro',
  description: 'Ficha oficial de atleta eSports.',
};

export default function AtletaFichaPage() {
  permanentRedirect('/eafc26/atleta/ficha');
}
