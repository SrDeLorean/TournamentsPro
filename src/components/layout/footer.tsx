'use client';

import Link from 'next/link';
import { Heart, Mail, Shield, Sparkles, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterProps {
  compact?: boolean;
}

const footerLinks = [
  { href: '/informacion#mission', label: 'Misión y visión', icon: Sparkles },
  { href: '/informacion#about', label: 'Quiénes somos', icon: Users },
  { href: 'mailto:contacto@tournamentspro.com', label: 'Contacto', icon: Mail },
  { href: '/informacion#privacy', label: 'Privacidad', icon: Shield },
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
          <p>Impulsamos comunidades eSports competitivas, transparentes y conectadas.</p>
        </div>

        <nav aria-label="Información institucional" className="app-footer-links">
          {footerLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href}><Icon className="size-3.5" />{label}</Link>)}
        </nav>

        <div className="app-footer-purpose">
          <Heart className="size-3.5" />
          <span>Hecho para la comunidad eSports</span>
        </div>
      </div>

      <div className="app-footer-bottom">
        <span>© 2026 TournamentsPro</span>
        <span>Competir · Conectar · Crecer</span>
      </div>
    </footer>
  );
}
