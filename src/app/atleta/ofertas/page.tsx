import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Ofertas de Fichaje | TournamentsPro',
  description: 'Gestión de contratos y ofertas de escuadras.',
};

export default function AtletaOfertasPage() {
  permanentRedirect('/eafc26/atleta/ofertas');
}
