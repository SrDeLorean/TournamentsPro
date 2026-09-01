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
  Flame,
  Gamepad2,
  Swords,
  Crown,
  Crosshair,
} from 'lucide-react';

import { useAuth } from '@/components/providers/auth-provider';
import { GoogleOAuthModal } from '@/components/auth/google-oauth-modal';
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

  // eSports active disciplines catalog for showcase
  const activeDisciplines = [
    { name: 'EA FC 26', mode: '11v11 Clubes Pro', color: '#72f7c1', icon: Trophy },
    { name: 'VALORANT', mode: '5v5 Táctico', color: '#ff4655', icon: Crosshair },
    { name: 'CS2 / CS:GO', mode: 'Competitivo 5v5', color: '#f8ae3c', icon: Swords },
    { name: 'LEAGUE OF LEGENDS', mode: 'Torneo 5v5', color: '#c89b3c', icon: Crown },
  ];

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
        setLoginError(result.error || 'Credenciales inválidas. Verifica tu gamertag y contraseña.');
      }
    } catch (err) {
      setLoginError('Error de conexión con el servidor eSports.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col justify-center overflow-x-hidden py-4 sm:py-8 lg:py-12 transition-colors duration-300">
      
      {/* 🌌 Theme-Responsive Ambient eSports Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-main)] via-[var(--bg-main)] to-[var(--bg-subtle)] opacity-95" />
        {/* Responsive Theme Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, var(--accent-cyan) 1px, transparent 1px), linear-gradient(to bottom, var(--accent-cyan) 1px, transparent 1px)`,
            backgroundSize: '40px 40px' 
          }} 
        />
        {/* Dynamic Ambient Neon Glows matching the active theme */}
        <div 
          className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] blur-[140px] rounded-full pointer-events-none opacity-40" 
          style={{ background: 'var(--accent-cyan)' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] blur-[160px] rounded-full pointer-events-none opacity-30" 
          style={{ background: 'var(--accent-violet)' }}
        />
        <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_0%,rgba(0,0,0,0.5)_90%]" />
      </div>

      {/* 🌟 MAIN eSPORTS CONTENT GRID */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center my-auto">
        
        {/* 🏆 LEFT COLUMN: Holographic eSports Arena & Showcase (Desktop / Tablet-L) */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-6">
          
          {/* Tactical HUD Header Tag */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--accent-cyan)] text-xs font-mono font-black uppercase tracking-wider backdrop-blur-md shadow-[0_0_20px_var(--accent-cyan-bg)]">
              <span className="size-2 rounded-full bg-[var(--accent-emerald)] animate-ping" />
              <Activity className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
              <span>CIRCUITO COMPETITIVO // TEMPORADA 2026</span>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-[var(--accent-violet-bg)] border border-[var(--accent-violet)] text-[var(--accent-violet)] text-[11px] font-mono font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[var(--accent-gold)] animate-pulse" />
              <span>MATCHDAYS EN VIVO</span>
            </div>
          </div>

          {/* Hero eSports Typography */}
          <div className="space-y-2">
            <h1 className="text-4xl xl:text-6xl font-black text-[var(--text-heading)] uppercase tracking-tight leading-[1.05] drop-shadow-2xl font-display">
              La Arena Pro de <br />
              <span className="bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-violet)] to-[var(--accent-gold)] bg-clip-text text-transparent">
                eSports en Sudamérica
              </span>
            </h1>
            <p className="text-sm xl:text-base text-[var(--text-secondary)] font-medium leading-relaxed max-w-xl">
              Accede a tu panel oficial para liderar tu club, reportar actas de partidos verificadas y negociar fichajes en el mercado libre de atletas.
            </p>
          </div>

          {/* Holographic Stage Panel */}
          <div className="relative w-full rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] backdrop-blur-xl p-6 overflow-hidden shadow-[var(--shadow-card)] flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-[var(--border-card-hover)] transition-all duration-300">
            
            {/* Ambient Theme Glow */}
            <div className="absolute -top-10 -left-10 size-64 bg-[var(--accent-cyan-bg)] blur-3xl pointer-events-none rounded-full" />
            <div className="absolute -bottom-10 -right-10 size-64 bg-[var(--accent-violet-bg)] blur-3xl pointer-events-none rounded-full" />

            {/* Left: 3D Live Trophy Canvas */}
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <HologramStage3D size={220} glowColor="var(--accent-cyan)" accentColor="var(--accent-violet)" />
              <div className="absolute -bottom-2 text-[10px] font-mono font-bold text-[var(--accent-cyan)] uppercase tracking-widest bg-[var(--bg-elevated)] px-3 py-0.5 rounded-full border border-[var(--border-card)] shadow-lg">
                ★ 3D CHAMPIONS TROPHY ★
              </div>
            </div>

            {/* Right: Live eSports Stats & Disciplines */}
            <div className="space-y-4 flex-1">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-[var(--accent-cyan)] uppercase tracking-widest">
                  [ PLATAFORMA VERIFICADA ]
                </span>
                <h3 className="text-lg font-black text-[var(--text-heading)] uppercase tracking-tight mt-0.5">
                  Estadísticas & Actas en Tiempo Real
                </h3>
              </div>

              {/* Active Discipline Chips */}
              <div className="grid grid-cols-2 gap-2">
                {activeDisciplines.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.name}
                      className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] hover:border-[var(--border-card-hover)] transition-colors flex items-center gap-2"
                    >
                      <div
                        className="size-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${item.color}18`, border: `1px solid ${item.color}40` }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-[var(--text-heading)] uppercase truncate">{item.name}</div>
                        <div className="text-[9px] font-semibold text-[var(--text-muted)] truncate">{item.mode}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tournament Telemetry Row */}
              <div className="flex items-center justify-between pt-1 text-xs border-t border-[var(--border-card)] font-mono">
                <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                  +120 Ligas Oficiales
                </span>
                <span className="text-[var(--accent-emerald)] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Anti-Cheat Protegido
                </span>
              </div>
            </div>
          </div>

          {/* Quick Competitive Features Grid */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--border-card-hover)] backdrop-blur-md transition-all duration-300 hover:translate-y-[-2px] space-y-1">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-lg bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)] flex items-center justify-center">
                  <Trophy className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                </div>
                <span className="text-xs font-black text-[var(--text-heading)] uppercase">Fixtures Pro</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">
                Generación automática y aprobación de resultados.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--border-card-hover)] backdrop-blur-md transition-all duration-300 hover:translate-y-[-2px] space-y-1">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-lg bg-[var(--accent-violet-bg)] border border-[var(--accent-violet)] flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-[var(--accent-violet)]" />
                </div>
                <span className="text-xs font-black text-[var(--text-heading)] uppercase">Mercado Libre</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">
                Contratación directa y bolsa de agentes libres.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--border-card-hover)] backdrop-blur-md transition-all duration-300 hover:translate-y-[-2px] space-y-1">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-lg bg-[var(--accent-gold-bg)] border border-[var(--accent-gold)] flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                </div>
                <span className="text-xs font-black text-[var(--text-heading)] uppercase">Clubes & Stats</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">
                Perfiles oficiales con ranking ELO y palmarés.
              </p>
            </div>
          </div>
        </div>

        {/* 🔐 RIGHT COLUMN: 3D Tilt Authentication Card (Responsive for Mobile & Desktop) */}
        <div className="w-full lg:col-span-5 flex justify-center">
          <Card3D
            maxTilt={8}
            glareEffect={true}
            neonBorder={true}
            className="w-full max-w-md shadow-2xl"
          >
            <div className="p-5 sm:p-7 md:p-8 space-y-4 sm:space-y-5">
              
              {/* Card Header with Tactical eSports Badge */}
              <Card3DItem depth={30}>
                <div className="text-center space-y-2">
                  
                  {/* Glowing eSports Emblem */}
                  <div className="relative mx-auto size-12 sm:size-14 rounded-2xl bg-gradient-to-br from-[var(--accent-cyan)] via-[var(--accent-violet)] to-[var(--accent-gold)] p-0.5 shadow-[0_0_25px_var(--accent-cyan-bg)] flex items-center justify-center">
                    <div className="w-full h-full bg-[var(--bg-elevated)] rounded-[14px] flex items-center justify-center">
                      <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-cyan)] animate-pulse" />
                    </div>
                    {/* Glowing Aura Ring */}
                    <div className="absolute -inset-1 rounded-2xl bg-[var(--accent-cyan-bg)] blur-md pointer-events-none -z-10" />
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-black text-[var(--accent-cyan)] uppercase tracking-widest block">
                      [ TERMINAL DE ACCESO OFICIAL ]
                    </span>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-[var(--text-heading)] font-display">
                      Iniciar Sesión
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                      Ingresa tus credenciales de atleta o capitán
                    </p>
                  </div>
                </div>
              </Card3DItem>

              {/* Google OAuth Button */}
              <Card3DItem depth={20}>
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(true)}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 dark:bg-[var(--bg-elevated)] dark:hover:bg-[var(--bg-card-hover)] dark:border dark:border-[var(--border-card)] text-slate-900 dark:text-[var(--text-primary)] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span className="truncate">Continuar con Google</span>
                </button>
              </Card3DItem>

              {/* Social Login Instant Buttons */}
              <Card3DItem depth={15}>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="min-h-[40px] p-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] hover:border-[#9146FF] text-[var(--text-secondary)] hover:text-[#c084fc] text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Tv className="w-4 h-4 text-[#9146FF] shrink-0" />
                    <span>Twitch</span>
                  </button>
                  <button
                    type="button"
                    className="min-h-[40px] p-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] hover:border-[#5865F2] text-[var(--text-secondary)] hover:text-[#818cf8] text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <MessageSquare className="w-4 h-4 text-[#5865F2] shrink-0" />
                    <span>Discord</span>
                  </button>
                </div>
              </Card3DItem>

              {/* Divider with Cyber Text */}
              <div className="relative flex items-center justify-center my-1">
                <div className="w-full border-t border-[var(--border-card)]" />
                <span className="absolute bg-[var(--bg-card)] px-3 text-[9px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  O credenciales del club
                </span>
              </div>

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                
                {/* Gamertag / Email */}
                <Card3DItem depth={10} className="space-y-1">
                  <label className="text-xs font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider font-display">
                    Gamertag o Correo Electrónico
                  </label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--accent-cyan)] transition-colors pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="ej. SrDeLorean o capitan@esports.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (loginError) setLoginError(null);
                      }}
                      className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-sm sm:text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-2 focus:ring-[var(--accent-cyan-bg)] transition-all"
                    />
                  </div>
                </Card3DItem>

                {/* Password */}
                <Card3DItem depth={10} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider font-display">
                      Contraseña
                    </label>
                    <a
                      href="#"
                      className="text-[11px] font-bold text-[var(--accent-cyan)] hover:brightness-125 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                  <div className="relative group">
                    <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--accent-cyan)] transition-colors pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (loginError) setLoginError(null);
                      }}
                      className="w-full min-h-[44px] pl-10 pr-11 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-sm sm:text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-2 focus:ring-[var(--accent-cyan-bg)] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Card3DItem>

                {/* Remember Me & Security Badge */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)] font-medium select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="size-4 rounded bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--accent-cyan)] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span>Recordar sesión</span>
                  </label>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[var(--accent-emerald)] shrink-0" />
                    SSL PROTEGIDO
                  </span>
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      role="alert"
                      className="flex items-start gap-2.5 rounded-xl border border-[var(--accent-crimson)] bg-[var(--accent-crimson-bg)] p-3 text-xs font-semibold text-[var(--accent-crimson)] shadow-md backdrop-blur-md"
                    >
                      <AlertCircle className="size-4 shrink-0 mt-0.5 text-[var(--accent-crimson)]" />
                      <span>{loginError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit CTA Button */}
                <Card3DItem depth={20} className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full min-h-[46px] h-12 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest text-[var(--accent-contrast)] bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-emerald)] to-[var(--accent-cyan)] hover:brightness-110 transition-all duration-300 shadow-[0_0_25px_var(--accent-cyan-bg)] hover:shadow-[0_0_35px_var(--accent-cyan-bg)] flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer"
                  >
                    {/* Glowing Laser Sheen Animation */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="size-4 rounded-full border-2 border-[var(--accent-contrast)] border-t-transparent animate-spin" />
                        <span>Verificando Atleta...</span>
                      </div>
                    ) : (
                      <>
                        <span>Ingresar a la Arena</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                      </>
                    )}
                  </button>
                </Card3DItem>
              </form>

              {/* Footer Register Link */}
              <Card3DItem depth={5}>
                <div className="pt-1 text-center text-xs text-[var(--text-muted)] font-medium">
                  ¿Aún no eres atleta registrado?{' '}
                  <Link
                    href="/registro"
                    className="font-bold text-[var(--accent-cyan)] hover:brightness-125 hover:underline transition-colors ml-1"
                  >
                    Crear cuenta eSports
                  </Link>
                </div>
              </Card3DItem>
            </div>
          </Card3D>
        </div>
      </main>

      {/* Google OAuth Modal */}
      <GoogleOAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
      />
    </div>
  );
}
