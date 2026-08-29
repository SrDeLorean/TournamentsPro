'use client';

import Link from 'next/link';
import { Gamepad2, HeartPulse, MessageSquare, Shield, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterProps {
  compact?: boolean;
}

const footerLinks = [
  { href: '/', label: 'Portal' },
  { href: '/organizaciones', label: 'Organizaciones' },
  { href: '/equipos', label: 'Equipos' },
  { href: '/usuarios', label: 'Jugadores' },
  { href: '/informacion', label: 'Información' },
];

export function Footer({ compact = false }: FooterProps) {
  return (
    <footer className={cn('app-footer', compact && 'app-footer-management')}>
      <div className="app-footer-accent" />
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <Link href="/" aria-label="Ir al portal de TournamentsPro" className="app-footer-logo">
            <span><Trophy className="size-4" /></span>
            <strong>TOURNAMENTS<span>PRO</span></strong>
          </Link>
          <p>Competición, clubes y atletas en un solo ecosistema.</p>
        </div>

        <nav aria-label="Navegación del pie de página" className="app-footer-links">
          {footerLinks.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>

        <div className="app-footer-status" title="Estado operativo del servicio">
          <HeartPulse className="size-3.5" />
          <span>Sistema operativo</span>
          <i aria-hidden="true" />
        </div>
      </div>

      <div className="app-footer-bottom">
        <span>© 2026 TournamentsPro</span>
        <div>
          <Link href="/informacion"><Shield className="size-3" />Privacidad</Link>
          <Link href="/informacion"><MessageSquare className="size-3" />Soporte</Link>
          <Link href="/informacion"><Gamepad2 className="size-3" />Reglamento</Link>
        </div>
      </div>
    </footer>
  );
}
