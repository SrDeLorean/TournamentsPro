'use client';

import { Button } from '@/components/ui/button';

export default function GameError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="standard-page-wrapper min-h-[60vh] items-center justify-center text-center">
      <div className="glass-panel max-w-xl p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-crimson)]">No pudimos cargar esta sección</p>
        <h1 className="mt-3 text-3xl font-black">Ocurrió un problema temporal</h1>
        <p className="mt-3 text-[var(--text-muted)]">Puedes intentarlo de nuevo sin perder tu configuración visual.</p>
        <Button className="mt-6" onClick={reset}>Reintentar</Button>
      </div>
    </main>
  );
}
