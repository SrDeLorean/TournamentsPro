'use client';

import { RouteErrorState } from '@/components/ui/route-error-state';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body>
        <RouteErrorState
          title="La plataforma necesita recuperarse"
          description="No pudimos reconstruir la vista. Reintenta o vuelve al inicio."
          reset={reset}
        />
      </body>
    </html>
  );
}
