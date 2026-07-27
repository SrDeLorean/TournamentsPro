'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Trophy, Mail, Lock, Sparkles, ArrowRight, ShieldCheck, Gamepad2, Tv, MessageSquare, Flame, CheckCircle2 } from 'lucide-react';

import { useAuth } from '@/components/providers/auth-provider';

import { GoogleOAuthModal } from '@/components/auth/google-oauth-modal';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll on initial load to focus 100% on auth content, revealing Navbar when scrolling up
  useEffect(() => {
    window.scrollTo({ top: 48, behavior: 'instant' });
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] grid grid-cols-1 lg:grid-cols-2 transition-colors duration-300">
      
      {/* 🖼️ LEFT HALF: Soft & Elegant eSports Image Banner (Desktop Web Only) */}
      <div className="hidden lg:relative lg:flex flex-col justify-between p-12 overflow-hidden bg-slate-950 border-r border-[var(--border-card)]">
        
        {/* Background Image Layer in Original Crisp Color & Brightness */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80"
            alt="eSports Tournament Portal"
            className="w-full h-full object-cover opacity-85 filter contrast-105 saturate-110"
          />
          {/* Soft Natural Fade only at the bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-black/20" />
        </div>

        {/* Top Brand Tag Header */}
        <div className="relative z-10 space-y-2">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-600 to-amber-500 p-0.5 shadow-xl group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div className="flex flex-col text-left drop-shadow-md">
              <span className="text-2xl font-black tracking-tight text-white uppercase leading-none">
                TOURNAMENTS<span className="text-cyan-400">PRO</span>
              </span>
              <span className="text-[10px] text-cyan-300 font-bold tracking-widest uppercase mt-0.5">
                Portal de Acceso eSports
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Hero Title Box in Soft Translucent Glass */}
        <div className="relative z-10 space-y-4 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/40 border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            ECOSISTEMA PROFESIONAL ESPORTS
          </div>

          <div className="space-y-3">
            {/* Pure White Text for 'Compite en las mejores ligas de' */}
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-md">
              <span className="text-white">Compite en las mejores ligas de</span>{' '}
              <span className="text-cyan-400">América del Sur</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-200 font-semibold leading-relaxed drop-shadow-sm">
              Accede a tu panel oficial para reportar partidos, gestionar fichajes de tu plantilla y consultar estadísticas individuales en tiempo real.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/40 border border-white/10 space-y-0.5 backdrop-blur-md">
                <span className="text-emerald-400 font-extrabold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Torneos Verificados
                </span>
                <span className="text-[10px] text-slate-200 font-medium block">Ligas 11v11, 5v5 y 3v3</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-white/10 space-y-0.5 backdrop-blur-md">
                <span className="text-amber-400 font-extrabold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mercado Libre
                </span>
                <span className="text-[10px] text-slate-200 font-medium block">Fichajes y bolsa de jugadores</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info inside Left Banner */}
        <div className="relative z-10 text-xs text-slate-200 font-bold drop-shadow-sm">
          © 2026 Tournaments Pro. Todos los derechos reservados.
        </div>
      </div>

      {/* 🔐 RIGHT HALF: Form Login Card */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        
        {/* Dynamic Ambient Neon Sphere Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/15 via-purple-500/15 to-amber-500/15 blur-3xl pointer-events-none rounded-full" />

        <div className="w-full max-w-md relative z-10 space-y-6">
          
          {/* Top Brand Banner Header (Mobile Only) */}
          <div className="text-center space-y-2 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-600 to-amber-500 p-0.5 shadow-xl group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-cyan-400 group-hover:rotate-12 transition-transform" />
                </div>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-2xl font-black tracking-tight text-[var(--text-heading)] uppercase leading-none">
                  TOURNAMENTS<span className="text-cyan-400">PRO</span>
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-bold tracking-widest uppercase mt-0.5">
                  Portal de Acceso eSports
                </span>
              </div>
            </Link>
          </div>

          {/* Main Authentication Card */}
          <Card className="glass-panel border border-[var(--border-card)] shadow-2xl p-6 sm:p-8 space-y-6">
            <CardHeader className="p-0 space-y-1 text-center">
              <CardTitle className="text-2xl font-black uppercase tracking-tight text-[var(--text-heading)]">
                Iniciar Sesión
              </CardTitle>
              <CardDescription className="text-xs text-[var(--text-secondary)] font-medium">
                Ingresa tus credenciales para acceder a tu panel de atleta o club
              </CardDescription>
            </CardHeader>

            {/* Google OAuth Primary Login Button */}
            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-extrabold flex items-center justify-center gap-2.5 transition-all shadow-lg hover:scale-[1.01]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continuar con Google</span>
            </button>

            {/* Social OAuth Instant Login Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-purple-500/40 text-purple-400 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.02]"
              >
                <Tv className="w-4 h-4" />
                Twitch
              </button>
              <button
                type="button"
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-indigo-500/40 text-indigo-400 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.02]"
              >
                <MessageSquare className="w-4 h-4" />
                Discord
              </button>
            </div>

            {/* Quick Real User Credentials Selector */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-2">
              <span className="text-[10px] font-black uppercase text-cyan-400 block tracking-wider text-center">
                🔑 Cuentas Oficiales de Acceso (Clave: 123456)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@tournamentspro.com');
                    setPassword('123456');
                  }}
                  className="p-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-400/50 text-cyan-300 text-[11px] font-extrabold flex flex-col items-center justify-center transition-all"
                >
                  <span>🛡️ Administrador</span>
                  <span className="text-[9px] text-slate-400 font-mono font-normal">admin@tournamentspro.com</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail('organizador@tournamentspro.com');
                    setPassword('123456');
                  }}
                  className="p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-400/50 text-purple-300 text-[11px] font-extrabold flex flex-col items-center justify-center transition-all"
                >
                  <span>🏆 Organizador</span>
                  <span className="text-[9px] text-slate-400 font-mono font-normal">organizador@tournamentspro.com</span>
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-heading)] block uppercase">
                  Gamertag o Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="ej. SrDeLorean o correo@esports.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl input-theme border border-[var(--border-card)] text-xs font-semibold focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-heading)] block uppercase">
                    Contraseña
                  </label>
                  <a href="#" className="text-[11px] font-bold text-[var(--accent-cyan)] hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl input-theme border border-[var(--border-card)] text-xs font-semibold focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)] font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[var(--border-card)] text-[var(--accent-cyan)] focus:ring-0"
                  />
                  Recordar mi sesión
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 font-black text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-xl"
              >
                {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <CardFooter className="p-0 pt-2 text-center flex flex-col items-center justify-center text-xs text-[var(--text-muted)]">
              <p>
                ¿Aún no tienes cuenta eSports?{' '}
                <Link href="/registro" className="font-bold text-[var(--accent-cyan)] hover:underline">
                  Regístrate gratis aquí
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Google OAuth Interactive Credentials Modal */}
      <GoogleOAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
      />
    </div>
  );
}
