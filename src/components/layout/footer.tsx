'use client';

import React from 'react';
import Link from 'next/link';
import { GAMES_CATALOG } from '@/lib/games-data';
import { Trophy, Shield, Radio, Sparkles, Globe, MessageSquare, Tv, Share2, Video } from 'lucide-react';

export function Footer() {
  const gamesList = Object.values(GAMES_CATALOG);

  return (
    <footer className="w-full bg-[var(--bg-card)] border-t border-[var(--border-card)] text-[var(--text-primary)] transition-colors duration-300 relative z-20">
      
      {/* 🔮 Top Accent Stripe with Brand Colors */}
      <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12">
          
          {/* Brand Column (2 cols wide on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5 fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-[var(--text-heading)] uppercase leading-none">
                  TOURNAMENTS<span className="text-[var(--accent-cyan)]">PRO</span>
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-bold tracking-widest uppercase mt-0.5">
                  Plataforma Oficial eSports
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm font-medium">
              Ecosistema profesional para la gestión de ligas, copas multidisciplina, tablas de posiciones en tiempo real y mercado de fichajes para comunidades de eSports.
            </p>

            {/* Social Media Badges */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href="https://twitch.tv"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-card)] flex items-center justify-center text-purple-400 hover:border-purple-400 hover:scale-110 transition-all shadow-sm"
                title="Twitch TV"
              >
                <Tv className="w-4 h-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-card)] flex items-center justify-center text-indigo-400 hover:border-indigo-400 hover:scale-110 transition-all shadow-sm"
                title="Comunidad Discord"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-card)] flex items-center justify-center text-cyan-400 hover:border-cyan-400 hover:scale-110 transition-all shadow-sm"
                title="Twitter / X"
              >
                <Share2 className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-card)] flex items-center justify-center text-rose-500 hover:border-rose-500 hover:scale-110 transition-all shadow-sm"
                title="Canal de YouTube"
              >
                <Video className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Disciplinas eSports Column */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs sm:text-sm text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Disciplinas
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-[var(--text-secondary)]">
              {gamesList.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/${g.slug}`}
                    className="hover:text-[var(--text-heading)] transition-colors flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: g.brandColor }} />
                    {g.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Secciones del Portal Column */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs sm:text-sm text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" />
              Navegación
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-[var(--text-secondary)]">
              <li>
                <Link href="/" className="hover:text-[var(--text-heading)] transition-colors">
                  Inicio del Portal
                </Link>
              </li>
              <li>
                <Link href="/organizaciones" className="hover:text-[var(--text-heading)] transition-colors">
                  Organizaciones
                </Link>
              </li>
              <li>
                <Link href="/eafc26/organizaciones" className="hover:text-[var(--text-heading)] transition-colors">
                  Torneos
                </Link>
              </li>
              <li>
                <Link href="/eafc26/equipos" className="hover:text-[var(--text-heading)] transition-colors">
                  Directorio de Escuadras
                </Link>
              </li>
              <li>
                <Link href="/informacion" className="hover:text-[var(--text-heading)] transition-colors">
                  Reglamento & Normativa
                </Link>
              </li>
            </ul>
          </div>

          {/* Estado del Sistema & Soporte */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs sm:text-sm text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-400" />
              Ecosistema
            </h4>
            <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-card)] space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-emerald-400 text-[11px] uppercase">SISTEMAS EN LÍNEA</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">
                Latencia: 14ms • Servidor América Sur
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 border-t border-[var(--border-card)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)] font-medium">
          <p>© 2026 Tournaments Pro. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <Link href="/informacion" className="hover:text-[var(--text-heading)] transition-colors">
              Términos de Servicio
            </Link>
            <Link href="/informacion" className="hover:text-[var(--text-heading)] transition-colors">
              Política de Privacidad
            </Link>
            <Link href="/informacion" className="hover:text-[var(--text-heading)] transition-colors">
              Soporte Técnico
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
