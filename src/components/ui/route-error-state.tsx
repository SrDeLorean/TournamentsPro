'use client';

import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RouteErrorStateProps {
  title?: string;
  description?: string;
  reset?: () => void;
  href?: string;
  className?: string;
}

export function RouteErrorState({
  title = 'No pudimos cargar esta sección',
  description = 'Ocurrió un problema temporal. Puedes reintentar sin perder tu configuración.',
  reset,
  href = '/',
  className,
}: RouteErrorStateProps) {
  return (
    <main className={cn('ui-route-state ui-route-error', className)} data-ui-state="error" role="alert" aria-live="assertive">
      <div className="ui-route-state-icon" aria-hidden="true"><AlertTriangle /></div>
      <p className="ui-route-state-eyebrow">Estado del sistema</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="ui-route-state-actions">
        {reset ? <Button onClick={reset}><RotateCcw className="size-4" />Reintentar</Button> : null}
        <Link href={href} className="ui-button ui-button-outline min-h-10 rounded-[var(--radius-control)] px-4 text-sm font-semibold">Volver al inicio</Link>
      </div>
    </main>
  );
}
