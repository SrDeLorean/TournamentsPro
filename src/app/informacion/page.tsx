import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Gamepad2,
  Globe2,
  Shield,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, PageHeaderMetrics } from '@/components/ui/page-header';

export const metadata: Metadata = {
  title: 'Información | TorneosPro',
  description: 'Conoce la plataforma multijuego que conecta organizaciones, clubes, competencias y atletas eSports.',
};

const PLATFORM_CAPABILITIES = [
  { id: 'disciplines', icon: Gamepad2, eyebrow: 'Portales por disciplina', title: 'Cada juego, una experiencia propia', description: 'Accede a calendarios, clasificaciones, equipos y estadísticas adaptados a la identidad de cada título.', href: '/', action: 'Explorar disciplinas' },
  { id: 'clubs', icon: Building2, eyebrow: 'Organizaciones', title: 'Gestiona todo el circuito competitivo', description: 'Centraliza ligas, torneos, clubes, inscripciones y operaciones desde un entorno compartido.', href: '/organizaciones', action: 'Ver organizaciones' },
  { id: 'athletes', icon: UserRound, eyebrow: 'Identidad competitiva', title: 'Un perfil para todos tus Gamertags', description: 'Reúne equipos, resultados, estadísticas e historial deportivo bajo una identidad verificable.', href: '/usuarios', action: 'Descubrir atletas' },
  { id: 'teams', icon: Shield, eyebrow: 'Clubes y plantillas', title: 'Equipos listos para competir', description: 'Consulta capitanes, integrantes, disciplinas activas y la trayectoria pública de cada escuadra.', href: '/equipos', action: 'Explorar equipos' },
  { id: 'leaderboard', icon: Trophy, eyebrow: 'Competencias', title: 'Resultados y torneos conectados', description: 'Sigue competencias, fixtures y posiciones desde un flujo claro para participantes y espectadores.', href: '/torneos', action: 'Ver torneos' },
  { id: 'api', icon: BarChart3, eyebrow: 'Datos consistentes', title: 'Información útil en cada decisión', description: 'Presentamos métricas, actividad y estados con los mismos componentes en todo el sistema.', href: '/components', action: 'Ver sistema visual' },
] as const;

const TRUST_PILLARS = [
  { id: 'mission', icon: Sparkles, title: 'Nuestra misión', description: 'Dar a clubes, atletas y organizadores herramientas claras para competir, crecer y construir una trayectoria eSports verificable.' },
  { id: 'fairplay', icon: Users, title: 'Comunidad y juego limpio', description: 'Diseñamos procesos visibles para resultados, plantillas, transferencias y participación responsable.' },
  { id: 'privacy', icon: Shield, title: 'Privacidad desde el diseño', description: 'Protegemos los datos de cuenta y mostramos públicamente solo la información deportiva destinada a cada perfil.' },
] as const;

function InformationFeatureCard({ id, icon: Icon, eyebrow, title, description, href, action }: { id: string; icon: LucideIcon; eyebrow: string; title: string; description: string; href?: string; action?: string }) {
  return (
    <Card id={id} className="public-info-card scroll-mt-28" variant="surface" interactive data-reactive-card>
      <CardHeader>
        <div className="public-info-card-icon"><Icon className="size-6" /></div>
        <p className="public-info-card-eyebrow">{eyebrow}</p>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {href && action ? (
        <CardFooter>
          <Link href={href} className="public-info-card-link">{action}<ArrowRight className="size-4" aria-hidden="true" /></Link>
        </CardFooter>
      ) : null}
    </Card>
  );
}

export default function InformationPage() {
  return (
    <main className="public-info-page">
      <PageHeader
        className="public-info-header scroll-mt-28"
        badgeText="Acerca de TorneosPro"
        badgeIcon={<Sparkles className="size-3.5" />}
        heroIcon={<Globe2 />}
        title="Toda la escena eSports"
        highlightTitle="conectada en TorneosPro"
        description="Organizaciones, clubes, atletas y competencias conviven en un entorno multijuego seguro, rápido y consistente."
        brandColor="var(--app-accent)"
        density="cinematic"
        footer={(
          <div className="public-info-actions">
            <Link href="/" className="public-info-primary">Explorar plataforma <ArrowRight className="size-4" /></Link>
            <Link href="/organizaciones" className="public-info-secondary">Ver organizaciones</Link>
          </div>
        )}
      >
        <PageHeaderMetrics items={[
          { icon: <Gamepad2 />, value: 'Multi', label: 'Disciplinas' },
          { icon: <Users />, value: 'Única', label: 'Comunidad' },
          { icon: <Trophy />, value: 'En vivo', label: 'Competición' },
        ]} />
      </PageHeader>

      <section id="about" className="public-info-content scroll-mt-28" aria-labelledby="public-info-capabilities">
        <header className="public-info-section-heading">
          <div><p>Capacidades principales</p><h2 id="public-info-capabilities">Todo el circuito en un solo lugar</h2></div>
          <span><Shield className="size-3.5" /> Ecosistema conectado</span>
        </header>
        <div className="public-info-grid">
          {PLATFORM_CAPABILITIES.map((capability) => <InformationFeatureCard key={capability.id} {...capability} />)}
        </div>
      </section>

      <section className="public-info-content public-info-trust" aria-labelledby="public-info-trust">
        <header className="public-info-section-heading">
          <div><p>Confianza y comunidad</p><h2 id="public-info-trust">Una plataforma responsable</h2></div>
          <span><Sparkles className="size-3.5" /> Principios de TorneosPro</span>
        </header>
        <div className="public-info-grid public-info-trust-grid">
          {TRUST_PILLARS.map((pillar) => <InformationFeatureCard key={pillar.id} {...pillar} eyebrow="Compromiso de plataforma" />)}
        </div>
      </section>
    </main>
  );
}
