import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Globe2, Shield, Gamepad2, Users, Sparkles, Trophy } from 'lucide-react';

export default function InformationPage() {
  return (
    <main className="public-info-page">
      <section className="public-info-hero">
        <div className="public-info-hero-glow" />
        <div className="public-info-copy">
          <div className="public-info-badge">
          <Sparkles className="w-4 h-4" />
          Acerca de TorneosEsport PRO
          </div>
          <h1>La plataforma de gestión eSports multijuego</h1>
          <p>Conectamos organizaciones, clubes y atletas en un entorno competitivo seguro, rápido y personalizado para cada disciplina.</p>
          <div className="public-info-actions">
            <Link href="/" className="public-info-primary">Explorar plataforma <ArrowRight className="size-4" /></Link>
            <Link href="/organizaciones" className="public-info-secondary">Ver organizaciones</Link>
          </div>
        </div>
        <div className="public-info-summary" aria-label="Resumen de plataforma">
          <div><Globe2 className="size-5" /><strong>Global</strong><span>Una comunidad conectada</span></div>
          <div><Trophy className="size-5" /><strong>Competitivo</strong><span>Torneos y clasificaciones</span></div>
          <div><Shield className="size-5" /><strong>Seguro</strong><span>Roles y gestión verificada</span></div>
        </div>
      </section>

      <section className="public-info-content" aria-labelledby="public-info-capabilities">
        <header className="public-info-section-heading">
          <div><p>Capacidades principales</p><h2 id="public-info-capabilities">Todo el circuito en un solo lugar</h2></div>
          <span>Tres pilares del ecosistema</span>
        </header>
        <div className="public-info-grid">
        <Card className="public-info-card glass-panel-hover">
          <CardHeader>
            <div className="public-info-card-icon is-cyan"><Gamepad2 className="size-6" /></div>
            <CardTitle>Portales Exclusivos</CardTitle>
            <CardDescription>Experiencia inmersiva por juego</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Cada disciplina (EA FC, Valorant, Rocket League, League of Legends) posee su propia paleta de colores, tablas de posiciones y estadísticas avanzadas.
          </CardContent>
        </Card>

        <Card className="public-info-card glass-panel-hover">
          <CardHeader>
            <div className="public-info-card-icon is-emerald"><Shield className="size-6" /></div>
            <CardTitle>Multitenancy de Organizaciones</CardTitle>
            <CardDescription>Control total para organizadores</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Crea ligas, torneos de eliminatoria, controla el mercado de fichajes y verifica las solicitudes de transferencia de los equipos.
          </CardContent>
        </Card>

        <Card className="public-info-card glass-panel-hover">
          <CardHeader>
            <div className="public-info-card-icon is-violet"><Users className="size-6" /></div>
            <CardTitle>Perfiles eSports de Jugador</CardTitle>
            <CardDescription>Cuentas unificadas por usuario</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Vincula tus Gamertags y Riot IDs bajo una sola cuenta y construye tu historial de clubes y estadísticas competitivas.
          </CardContent>
        </Card>
      </div>
      </section>
    </main>
  );
}
