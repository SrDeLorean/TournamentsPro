import type { Metadata } from 'next';
import FinalDesignSystemPage from '@/features/design-system/components/final-design-system-page';

export const metadata: Metadata = {
  title: 'Catálogo Maestro de Componentes UI & Sistema de Diseño | TorneosPro',
  description: 'Suite integral de componentes UI, identidad GameSlug, multi-tema Claro/Oscuro/OLED y formularios eSports de TorneosPro.',
};

export default function ComponentsPage() {
  return <FinalDesignSystemPage />;
}
