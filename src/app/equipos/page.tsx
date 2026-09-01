import type { Metadata } from 'next';
import { ViewTransition } from 'react';
import GlobalDirectoryPage from '@/components/public/global-directory-page';

export const metadata: Metadata = {
  title: 'Equipos y clubes | TorneosPro',
  description: 'Directorio público de equipos y clubes eSports.',
};

export default function TeamsPage() {
  return (
    <ViewTransition
      enter={{ 'nav-forward': 'team-nav-forward', 'nav-back': 'team-nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'team-nav-forward', 'nav-back': 'team-nav-back', default: 'none' }}
      default="none"
    >
      <GlobalDirectoryPage kind="teams" />
    </ViewTransition>
  );
}
