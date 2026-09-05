import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function GameNotFound() {
  return (
    <main className="standard-page-wrapper min-h-[60vh] items-center justify-center text-center">
      <div className="glass-panel max-w-xl p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--app-accent)]">Ruta no disponible</p>
        <h1 className="mt-3 text-3xl font-black">Juego o sección no encontrada</h1>
        <p className="mt-3 text-[var(--text-muted)]">Comprueba la dirección o vuelve al catálogo de disciplinas.</p>
        <Link href="/" className="mt-6 inline-flex"><Button>Volver al inicio</Button></Link>
      </div>
    </main>
  );
}
