'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Trophy, Mail, Lock, User, Gamepad2, ArrowRight, CheckCircle2, Tv, MessageSquare, Flame } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';
import { useAuth } from '@/components/providers/auth-provider';

import { GoogleOAuthModal } from '@/components/auth/google-oauth-modal';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const gamesList = Object.values(GAMES_CATALOG);

  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const [gamertag, setGamertag] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [primaryGame, setPrimaryGame] = useState('eafc26');
  const [platform, setPlatform] = useState('PS5');
  const [role, setRole] = useState('JUGADOR');
  const [acceptTerms, setAcceptTerms] = useState(false);
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
    if (!acceptTerms) return;
    setIsLoading(true);
    const success = await register({
      gamertag: gamertag.trim(),
      name: fullName.trim(),
      primaryGame: primaryGame as 'eafc26' | 'valorant' | 'csgo' | 'lol' | 'rocketleague',
      platform: platform as 'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY',
      role: role === 'CAPITAN' ? 'Capitán' : role === 'ORGANIZADOR' ? 'Organizador' : 'Jugador',
    });
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
          <Image
            src="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600&auto=format&fit=crop&q=80"
            alt="eSports Tournament Registration"
            fill
            sizes="50vw"
            unoptimized
            className="object-cover opacity-85 filter contrast-105 saturate-110"
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
                Registro de Atletas & Capitanes
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Hero Title Box in Soft Translucent Glass */}
        <div className="relative z-10 space-y-4 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/40 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            ÚNETE AL CIRCUITO ESPORTS 2026
          </div>

          <div className="space-y-3">
            {/* Pure White Text for 'Crea tu Ficha Oficial de' */}
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-tight drop-shadow-md">
              <span className="text-white">Crea tu Ficha Oficial de</span>{' '}
              <span className="text-cyan-400">Atleta o Club</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-200 font-semibold leading-relaxed drop-shadow-sm">
              Inscribe tu plantilla, publica solicitudes en la Agencia Libre y compite por los premios en metálico de los campeonatos oficiales.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/40 border border-white/10 space-y-0.5 backdrop-blur-md">
                <span className="text-cyan-400 font-extrabold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ficha Personal
                </span>
                <span className="text-[10px] text-slate-200 font-medium block">Estadísticas y Gamertag oficial</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-white/10 space-y-0.5 backdrop-blur-md">
                <span className="text-purple-400 font-extrabold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Gestión de Club
                </span>
                <span className="text-[10px] text-slate-200 font-medium block">Capitanes y escuadras Pro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info inside Left Banner */}
        <div className="relative z-10 text-xs text-slate-200 font-bold drop-shadow-sm">
          © 2026 Tournaments Pro. Plataforma Oficial eSports.
        </div>
      </div>

      {/* 📝 RIGHT HALF: Form Register Card */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        
        {/* Dynamic Ambient Neon Sphere Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-purple-500/15 via-cyan-500/15 to-amber-500/15 blur-3xl pointer-events-none rounded-full" />

        <div className="w-full max-w-xl relative z-10 space-y-6">
          
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
                  Registro de Atletas & Capitanes
                </span>
              </div>
            </Link>
          </div>

          {/* Main Registration Card */}
          <Card className="glass-panel border border-[var(--border-card)] shadow-2xl p-6 sm:p-8 space-y-6">
            <CardHeader className="p-0 space-y-1 text-center">
              <CardTitle className="text-2xl font-black uppercase tracking-tight text-[var(--text-heading)]">
                Crear Cuenta eSports
              </CardTitle>
              <CardDescription className="text-xs text-[var(--text-secondary)] font-medium">
                Únete a la plataforma oficial para competir en torneos, publicar fichajes y liderar tu club
              </CardDescription>
            </CardHeader>

            {/* Google OAuth Primary Registration Button */}
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
              <span>Registrarse con Google</span>
            </button>

            {/* Social Registration OAuth */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-purple-500/40 text-purple-400 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.02]"
              >
                <Tv className="w-4 h-4" />
                Registrar con Twitch
              </button>
              <button
                type="button"
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-indigo-500/40 text-indigo-400 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.02]"
              >
                <MessageSquare className="w-4 h-4" />
                Registrar con Discord
              </button>
            </div>

            <div className="relative flex items-center justify-center my-2">
              <div className="w-full border-t border-[var(--border-card)]" />
              <span className="bg-[var(--bg-card)] px-3 text-[10px] uppercase font-bold text-[var(--text-muted)] absolute">
                o datos de perfil
              </span>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gamertag */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-heading)] block uppercase">
                    Gamertag / Nick In-Game
                  </label>
                  <div className="relative">
                    <Gamepad2 className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="ej. SrDeLorean"
                      value={gamertag}
                      onChange={(e) => setGamertag(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl input-theme border border-[var(--border-card)] text-xs font-semibold focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-heading)] block uppercase">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="ej. Sebastián Rodríguez"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl input-theme border border-[var(--border-card)] text-xs font-semibold focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-heading)] block uppercase">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl input-theme border border-[var(--border-card)] text-xs font-semibold focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-heading)] block uppercase">
                  Contraseña Segura
                </label>
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

              {/* eSports Preferences Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] block uppercase">
                    Juego Principal
                  </label>
                  <select
                    value={primaryGame}
                    onChange={(e) => setPrimaryGame(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl input-theme border border-[var(--border-card)] text-xs font-bold"
                  >
                    {gamesList.map((g) => (
                      <option key={g.id} value={g.slug}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] block uppercase">
                    Plataforma
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl input-theme border border-[var(--border-card)] text-xs font-bold"
                  >
                    <option value="PS5">PS5</option>
                    <option value="PS4">PS4</option>
                    <option value="XBOX">XBOX</option>
                    <option value="PC">PC</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] block uppercase">
                    Perfil / Rol
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl input-theme border border-[var(--border-card)] text-xs font-bold"
                  >
                    <option value="JUGADOR">Jugador Libre</option>
                    <option value="CAPITAN">Capitán de Club</option>
                    <option value="ORGANIZADOR">Organizador</option>
                  </select>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-2 pt-2 text-xs text-[var(--text-secondary)] font-medium">
                <input
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="rounded border-[var(--border-card)] text-[var(--accent-cyan)] focus:ring-0"
                />
                <span>
                  Acepto los{' '}
                  <Link href="/informacion" className="font-bold text-[var(--accent-cyan)] hover:underline">
                    Términos de Servicio
                  </Link>{' '}
                  y la política de privacidad eSports.
                </span>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !acceptTerms}
                className="w-full h-11 font-black text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 via-purple-600 to-amber-500 hover:from-cyan-400 hover:to-purple-500 text-white shadow-xl"
              >
                {isLoading ? 'Creando Perfil...' : 'Completar Registro eSports'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <CardFooter className="p-0 pt-2 text-center flex flex-col items-center justify-center text-xs text-[var(--text-muted)]">
              <p>
                ¿Ya estás registrado?{' '}
                <Link href="/login" className="font-bold text-[var(--accent-cyan)] hover:underline">
                  Inicia sesión aquí
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
