'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  Tv,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Zap,
  Activity,
  Globe2,
} from 'lucide-react';

import { useAuth } from '@/components/providers/auth-provider';
import { GoogleOAuthModal } from '@/components/auth/google-oauth-modal';
import { CyberSpaceCanvas } from '@/components/3d/cyber-space-canvas';
import { HologramStage3D } from '@/components/3d/hologram-stage-3d';
import { Card3D, Card3DItem } from '@/components/3d/card-3d';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Auto-scroll on initial load to focus on content
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoginError(null);
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setLoginError(result.error || 'Credenciales inválidas. Verifica tu usuario y contraseña.');
      }
    } catch (err) {
      setLoginError('Error en el servidor al intentar iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030712] text-[var(--text-primary)] flex flex-col justify-between overflow-x-hidden">
      
      {/* 🌌 FULLSCREEN 3D CYBERSPACE CANVAS BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <CyberSpaceCanvas density="high" showGrid={true} interactive={true} />
        {/* Soft Radial Vignette for Content Readability */}
        <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_0%,rgba(3,7,18,0.8)_85%]" />
      </div>

      {/* 🚀 TOP FLOATING BRAND BAR */}
      <header className="relative z-20 w-full px-6 py-5 max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.08, rotate: [0, -6, 6, 0] }}
            transition={{ duration: 0.35 }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-500 to-amber-400 p-0.5 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
          >
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-cyan-400 group-hover:text-amber-400 transition-colors" />
            </div>
          </motion.div>
          <div className="flex flex-col text-left">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase leading-none drop-shadow-md">
              TOURNAMENTS<span className="text-cyan-400">PRO</span>
            </span>
            <span className="text-[10px] text-cyan-300 font-extrabold tracking-widest uppercase mt-0.5 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Portal 3D eSports 2026
            </span>
          </div>
        </Link>

        {/* Live System Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-xs font-mono font-bold text-cyan-300 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.15)]">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>SERVER: ONLINE</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400">LATAM 12ms</span>
        </div>
      </header>

      {/* 🌟 MAIN 3D INTERACTIVE CONTENT GRID */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* 🏆 LEFT COLUMN: 3D Holographic Stage & Cyber Feature Presentation */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-6">
          
          {/* Cyber Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase tracking-wider backdrop-blur-md w-fit shadow-[0_0_20px_rgba(0,240,255,0.25)]">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
            ECOSISTEMA ESPORTS DE NUEVA GENERACIÓN
          </div>

          {/* Hero Typography */}
          <div className="space-y-3">
            <h1 className="text-4xl xl:text-6xl font-black text-white uppercase tracking-tight leading-[1.08] drop-shadow-2xl">
              Compite en el <br />
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-300 bg-clip-text text-transparent">
                Circuito 3D
              </span>{' '}
              de América
            </h1>
            <p className="text-sm xl:text-base text-slate-300 font-medium leading-relaxed max-w-xl">
              Ingresa al centro de comando para gestionar clubes, registrar reportes de partidos en tiempo real y fichar atletas verificados.
            </p>
          </div>

          {/* 3D Holographic Interactive Stage Showcase */}
          <div className="relative w-full rounded-3xl bg-slate-950/60 border border-cyan-500/20 backdrop-blur-md p-6 overflow-hidden shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-cyan-500/40 transition-colors">
            
            {/* Ambient Backlight */}
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 size-72 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 blur-3xl pointer-events-none rounded-full" />

            {/* Left 3D Interactive Stage Canvas */}
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <HologramStage3D size={240} glowColor="#00f0ff" accentColor="#c084fc" />
              <div className="absolute -bottom-2 text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                ★ 3D HOLO TROPHY ★
              </div>
            </div>

            {/* Right Interactive Highlights */}
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 text-xs font-mono font-extrabold text-purple-300 uppercase">
                <Globe2 className="w-4 h-4 text-purple-400" />
                <span>CIRCUITO OFICIAL 2026</span>
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Ligas 11v11, 5v5 & Torneos Pro
              </h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Interactúa con el trofeo holográfico 3D moviendo el cursor. Disfruta de una experiencia inmersiva optimizada a 60 FPS.
              </p>

              {/* Mini Interactive Metric Pills */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/30">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Clubes Registrados</span>
                  <span className="text-sm font-black font-mono text-cyan-300">1,240+</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/30">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Premios en Juego</span>
                  <span className="text-sm font-black font-mono text-purple-300">\$25,000 USD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick 3D Highlight Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 hover:border-cyan-400/40 backdrop-blur-md transition-all duration-300 hover:translate-y-[-2px] space-y-1 group">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xs font-extrabold text-white uppercase">Torneos Verificados</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Reglas automáticas, fixtures inteligentes y actas oficiales.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 hover:border-amber-400/40 backdrop-blur-md transition-all duration-300 hover:translate-y-[-2px] space-y-1 group">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs font-extrabold text-white uppercase">Mercado de Pases</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Ofertas directas, contratos de escuadras y traspasos.
              </p>
            </div>
          </div>
        </div>

        {/* 🔐 RIGHT COLUMN: 3D Tilt Authentication Card */}
        <div className="w-full lg:col-span-5 flex justify-center">
          <Card3D
            maxTilt={10}
            glareEffect={true}
            neonBorder={true}
            className="w-full max-w-md"
          >
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Card Header with 3D Depth Emblem */}
              <Card3DItem depth={35}>
                <div className="text-center space-y-3">
                  <div className="relative mx-auto size-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-600 to-amber-400 p-0.5 shadow-[0_0_30px_rgba(0,240,255,0.4)] flex items-center justify-center">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                      <Lock className="w-7 h-7 text-cyan-400 animate-pulse" />
                    </div>
                    {/* Glowing Aura Ring */}
                    <div className="absolute -inset-1 rounded-2xl bg-cyan-400/20 blur-md pointer-events-none -z-10" />
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                      Iniciar Sesión
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Ingresa al portal oficial para competir y gestionar tu escuadra
                    </p>
                  </div>
                </div>
              </Card3DItem>

              {/* Google OAuth Button */}
              <Card3DItem depth={25}>
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_6px_25px_rgba(255,255,255,0.25)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continuar con Google</span>
                </button>
              </Card3DItem>

              {/* Social Login Instant Buttons */}
              <Card3DItem depth={20}>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(192,132,252,0.1)] hover:border-purple-400"
                  >
                    <Tv className="w-4 h-4 text-purple-400" />
                    <span>Twitch</span>
                  </button>
                  <button
                    type="button"
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:border-indigo-400"
                  >
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span>Discord</span>
                  </button>
                </div>
              </Card3DItem>

              {/* Divider with Cyber Text */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-white/10" />
                <span className="absolute bg-slate-950 px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                  O credenciales directas
                </span>
              </div>

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Gamertag / Email */}
                <Card3DItem depth={15} className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-200 block uppercase tracking-wider">
                    Gamertag o Correo Electrónico
                  </label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="text"
                      required
                      placeholder="ej. SrDeLorean o correo@esports.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (loginError) setLoginError(null);
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    />
                  </div>
                </Card3DItem>

                {/* Password */}
                <Card3DItem depth={15} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-200 block uppercase tracking-wider">
                      Contraseña
                    </label>
                    <a
                      href="#"
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                  <div className="relative group">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (loginError) setLoginError(null);
                      }}
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Card3DItem>

                {/* Remember Me */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="size-4 rounded bg-slate-900 border-white/20 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span>Recordar mi sesión</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    SSL 256-BIT
                  </span>
                </div>

                {/* Error Banner with 3D Pop */}
                <AnimatePresence>
                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      role="alert"
                      className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-xs font-semibold text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)] backdrop-blur-md"
                    >
                      <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" />
                      <span>{loginError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 3D Submit Button */}
                <Card3DItem depth={30} className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 hover:from-cyan-300 hover:to-teal-200 transition-all duration-300 shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.6)] flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                  >
                    {/* Glowing Laser Sheen Animation */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="size-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                        <span>Verificando Credenciales...</span>
                      </div>
                    ) : (
                      <>
                        <span>Acceder a la Arena</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </Card3DItem>
              </form>

              {/* Footer Register Link */}
              <Card3DItem depth={10}>
                <div className="pt-2 text-center text-xs text-slate-400 font-medium">
                  ¿Aún no tienes cuenta eSports?{' '}
                  <Link
                    href="/registro"
                    className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors ml-1"
                  >
                    Regístrate gratis aquí
                  </Link>
                </div>
              </Card3DItem>
            </div>
          </Card3D>
        </div>
      </main>

      {/* 🛡️ BOTTOM MINIMAL FOOTER */}
      <footer className="relative z-20 w-full px-6 py-4 text-center text-xs text-slate-500 font-semibold max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/5">
        <div>
          © 2026 <span className="text-slate-400">TournamentsPro eSports</span>. Todos los derechos reservados.
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <Link href="/informacion" className="hover:text-cyan-400 transition-colors">Reglamento</Link>
          <span>•</span>
          <Link href="/informacion" className="hover:text-cyan-400 transition-colors">Términos de Servicio</Link>
          <span>•</span>
          <Link href="/informacion" className="hover:text-cyan-400 transition-colors">Seguridad</Link>
        </div>
      </footer>

      {/* Google OAuth Modal */}
      <GoogleOAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
      />
    </div>
  );
}
