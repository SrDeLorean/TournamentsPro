import type { Metadata } from 'next';
import ComponentsShowcaseClient from '@/features/design-system/components/components-showcase-client';

export const metadata: Metadata = { title: 'Catálogo de componentes | TorneosPro' };

export default function ComponentsPage() {
  return <ComponentsShowcaseClient />;
}
