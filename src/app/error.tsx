'use client';

import { RouteErrorState } from '@/components/ui/route-error-state';

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorState reset={reset} />;
}
