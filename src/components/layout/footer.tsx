'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FooterProps {
  compact?: boolean;
  brandColor?: string;
}

const FOOTER_COLUMNS = [
  {
    title: 'Competición',
    links: [
      { href: '/torneos', label: 'Explorar Torneos' },
      { href: '/informacion#disciplines', label: 'Disciplinas eSports' },
      { href: '/informacion#leaderboard', label: 'Tabla de Posiciones' },
      { href: '/informacion#brackets', label: 'Playoffs & Brackets' },
      { href: '/informacion#rules', label: 'Reglamento Oficial' },
    ],
  },
  {
    title: 'Comunidad',
    links: [
      { href: '/informacion#clubs', label: 'Clubes Verificados' },
      { href: '/informacion#transfers', label: 'Mercado de Fichajes' },
      { href: '/informacion#athletes', label: 'Atletas & Gamertags' },
      { href: '/informacion#fairplay', label: 'Fair Play & Anti-Cheat' },
      { href: '/informacion#community', label: 'Comunidad Discord' },
    ],
  },
  {
    title: 'Plataforma',
    links: [
      { href: '/components', label: 'Design System 3.0' },
      { href: '/components#foundations', label: 'Tokens Matemáticos' },
      { href: '/components#components', label: 'Catálogo de UI' },
      { href: '/informacion#status', label: 'Estado del Servidor' },
      { href: '/informacion#api', label: 'Documentación API' },
    ],
  },
  {
    title: 'Institucional',
    links: [
      { href: '/informacion#about', label: 'Quiénes Somos' },
      { href: '/informacion#mission', label: 'Misión y Visión' },
      { href: '/informacion#privacy', label: 'Política de Privacidad' },
      { href: '/informacion#terms', label: 'Términos de Servicio' },
      { href: 'mailto:contacto@tournamentspro.com', label: 'Mesa de Ayuda' },
    ],
  },
];

const SOCIAL_NETWORKS = [
  {
    name: 'Discord',
    href: 'https://discord.gg',
    svg: (
      <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
  },
  {
    name: 'Twitch',
    href: 'https://twitch.tv',
    svg: (
      <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
      </svg>
    ),
  },
  {
    name: 'X',
    href: 'https://twitter.com',
    svg: (
      <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com',
    svg: (
      <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
];

export function Footer({ compact = false, brandColor }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      setSubscribed(true);
      window.setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };
  const footerStyle = {
    '--navigation-brand': brandColor || 'var(--app-accent)',
  } as React.CSSProperties;

  // ── MODO COMPACTO (PANELES DE GESTIÓN Y ADMINISTRACIÓN) ──
  if (compact) {
    return (
      <footer className="app-footer app-footer-management ui-navigation-surface" style={footerStyle}>
        <div className="app-footer-accent" />
        <div className="app-footer-compact-inner">
          <div className="app-footer-compact-brand">
            <Link href="/" aria-label="Ir al inicio" className="app-footer-logo">
              <span><Trophy className="size-4" /></span>
              <strong>TOURNAMENTS<span>PRO</span></strong>
            </Link>
            <div className="app-footer-status">
              <span className="app-footer-status-dot" />
              <span>Consola de Gestión Activa</span>
            </div>
          </div>

          <nav aria-label="Enlaces rápidos de administración" className="app-footer-compact-links">
            <Link href="/components">Design System</Link>
            <Link href="/informacion#privacy">Privacidad</Link>
            <Link href="/informacion#terms">Términos</Link>
            <Link href="mailto:contacto@tournamentspro.com">Mesa de Ayuda</Link>
          </nav>

          <div className="app-footer-compact-copy">
            <span>© 2026 TournamentsPro</span>
          </div>
        </div>
      </footer>
    );
  }

  // ── MODO COMPLETO (PORTAL PÚBLICO Y COMPETITIVO) ──
  return (
    <footer className="app-footer ui-navigation-surface" style={footerStyle}>
      <div className="app-footer-accent" />

      <div className="app-footer-main">
        {/* Columna de Marca y Misión */}
        <div className="app-footer-brand-col">
          <Link href="/" aria-label="Ir al portal de TournamentsPro" className="app-footer-logo">
            <span><Trophy className="size-5" /></span>
            <strong>TOURNAMENTS<span>PRO</span></strong>
          </Link>
          <p className="app-footer-mission">
            Plataforma integral de torneos y competiciones eSports. Fixtures matemáticos, clasificaciones en vivo, perfiles de atletas y gestión multi-disciplina.
          </p>

          {/* Widget de Estado de Servidor en Vivo */}
          <div className="app-footer-status-card">
            <div className="app-footer-status-indicator">
              <span className="app-footer-status-dot" />
              <strong>Sistemas Operativos</strong>
            </div>
            <span className="app-footer-status-metric">Latencia &lt; 25ms · 99.98% Uptime</span>
          </div>

          {/* Redes Sociales eSports */}
          <div className="app-footer-socials" aria-label="Comunidad en redes sociales">
            {SOCIAL_NETWORKS.map((sn) => (
              <a
                key={sn.name}
                href={sn.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visitar canal oficial de ${sn.name}`}
                className="app-footer-social-btn"
              >
                {sn.svg}
              </a>
            ))}
          </div>
        </div>

        {/* 4 Columnas de Navegación Estructurada */}
        <div className="app-footer-nav-grid">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="app-footer-nav-col">
              <h2>{col.title}</h2>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>
                      <span>{link.label}</span>
                      {link.href.startsWith('mailto') && <Mail className="size-3 opacity-60 ml-1" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Caja de Suscripción a Torneos y Clasificaciones */}
        <div className="app-footer-newsletter-col">
          <div className="app-footer-newsletter-card">
            <div className="app-footer-newsletter-header">
              <Sparkles className="size-4 text-[var(--app-accent)]" />
              <h2>Alertas de Torneo</h2>
            </div>
            <p>Recibe convocatorias a campeonatos mayores, apertura de inscripciones y fixtures.</p>

            <form onSubmit={handleSubscribe} className="app-footer-newsletter-form">
              <div className="app-footer-newsletter-input-wrap">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu-correo@esports.com"
                  required
                  aria-label="Correo electrónico para alertas"
                  icon={<Mail className="size-4" />}
                  className="app-footer-newsletter-input"
                />
              </div>
              <Button type="submit" size="sm" className="app-footer-newsletter-btn" aria-live="polite">
                {subscribed ? (
                  <>
                    <Check className="size-3.5" />
                    <span>¡Suscrito!</span>
                  </>
                ) : (
                  <>
                    <span>Suscribir</span>
                    <Send className="size-3.5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Barra Inferior (Bottom Bar) */}
      <div className="app-footer-bottom">
        <div className="app-footer-bottom-inner">
          <div className="app-footer-copyright">
            <span>© 2026 TournamentsPro Inc. Todos los derechos reservados.</span>
            <span className="app-footer-badge"><ShieldCheck className="size-3 text-[var(--navigation-brand)]" /> WCAG AAA</span>
            <span className="app-footer-badge"><Zap className="size-3 text-[var(--app-accent)]" /> Core 3.0</span>
          </div>
          <div className="app-footer-tagline">
            <span>Competir</span> · <span>Conectar</span> · <span>Crecer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
