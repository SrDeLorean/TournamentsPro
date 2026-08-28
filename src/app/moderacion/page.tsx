import { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Moderación & Chat | TournamentsPro',
  description: 'Panel de moderación, control de baneos y chat global',
};

export default function ModeracionPage() {
  permanentRedirect('/dashboard/moderacion');
}
