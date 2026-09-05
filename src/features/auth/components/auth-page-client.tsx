'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Mail,
  Lock,
  User,
  Gamepad2,
  ArrowRight,
  CheckCircle2,
  Flame,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Activity,
  Crosshair,
  Swords,
  Crown,
  LogIn,
  UserPlus,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';
import { useAuth } from '@/components/providers/auth-provider';
import { buildRegistrationPayload, validateRegistrationForm } from '@/features/auth/lib/register-form';
import { AuthProviderButtons } from '@/features/auth/components/auth-provider-buttons';
import dynamic from 'next/dynamic';

const GoogleOAuthModal = dynamic(
  () => import('@/components/auth/google-oauth-modal').then((m) => m.GoogleOAuthModal),
  { ssr: false }
);

const HologramStage3D = dynamic(
  () => import('@/components/3d/hologram-stage-3d').then((m) => m.HologramStage3D),
  { ssr: false }
);
import { Card3D, Card3DItem } from '@/components/3d/card-3d';

interface AuthPageClientProps {
  initialMode?: 'login' | 'register';
}

export default function AuthPageClient({ initialMode = 'login' }: AuthPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { login, register, isAuthenticated } = useAuth();
  const gamesList = Object.values(GAMES_CATALOG);

  const mode = pathname?.includes('registro') ? 'register' : initialMode;
  // Direction for slide animation: 1 = to register (slide left), -1 = to login (slide right)
  const [direction, setDirection] = useState<number>(0);

  // Common UI State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register form state
  const [gamertag, setGamertag] = useState('');
  const [fullName, setFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerShowPassword, setRegisterShowPassword] = useState(false);
  const [primaryGame, setPrimaryGame] = useState('eafc26');
  const [platform, setPlatform] = useState('PS5');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // eSports active disciplines catalog for showcase
  const activeDisciplines = [
    { name: 'EA FC 26', mode: '11v11 Clubes Pro', slug: 'eafc26', icon: Trophy },
    { name: 'VALORANT', mode: '5v5 Táctico', slug: 'valorant', icon: Crosshair },
    { name: 'CS2 / CS:GO', mode: 'Competitivo 5v5', slug: 'csgo', icon: Swords },
    { name: 'LEAGUE OF LEGENDS', mode: 'Torneo 5v5', slug: 'lol', icon: Crown },
    { name: 'ROCKET LEAGUE', mode: '3v3 Vehicular', slug: 'rocketleague', icon: Flame },
    { name: 'FORTNITE', mode: 'Battle Royale', slug: 'fortnite', icon: Zap },
  ];

  // Redirect if already authenticated
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Switch mode smoothly and update browser URL without full page reload
  const switchMode = (newMode: 'login' | 'register') => {
    if (newMode === mode) return;
    setAuthError(null);
    setDirection(newMode === 'register' ? 1 : -1);
    const targetUrl = newMode === 'register' ? '/registro' : '/login';
    router.push(targetUrl, { scroll: false });
  };

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) return;
    setAuthError(null);
    setIsLoading(true);

    try {
      const result = await login(loginEmail, loginPassword);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setAuthError(result.error || 'Credenciales inválidas. Verifica tu gamertag y contraseña.');
      }
    } catch {
      setAuthError('Error de conexión con el servidor eSports.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) return;
    const formValues = {
      gamertag,
      fullName,
      email: registerEmail,
      password: registerPassword,
      primaryGame: primaryGame as 'eafc26' | 'valorant' | 'csgo' | 'lol' | 'rocketleague',
      platform: platform as 'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY',
    };
    const validationError = validateRegistrationForm(formValues);
    if (validationError) {
      setAuthError(validationError);
      return;
    }
    setAuthError(null);
    setIsLoading(true);

    try {
      const result = await register(buildRegistrationPayload(formValues));
      if (result.success) {
        router.push('/dashboard');
      } else {
        setAuthError(result.error || 'No fue posible completar el registro.');
      }
    } catch {
      setAuthError('Error de conexión con el servidor eSports.');
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants for smooth form sliding
  const slideVariants: {
    enter: (dir: number) => { x: number; opacity: number; scale: number };
    center: {
      x: number;
      opacity: number;
      scale: number;
      transition: {
        x: { type: 'spring'; stiffness: number; damping: number };
        opacity: { duration: number };
        scale: { duration: number };
      };
    };
    exit: (dir: number) => {
      x: number;
      opacity: number;
      scale: number;
      transition: {
        x: { type: 'spring'; stiffness: number; damping: number };
        opacity: { duration: number };
        scale: { duration: number };
      };
    };
  } = {
    enter: (dir: number) => ({
      x: dir > 0 ? 24 : -24,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 320, damping: 28 },
        opacity: { duration: 0.22 },
        scale: { duration: 0.22 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -24 : 24,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring' as const, stiffness: 320, damping: 28 },
        opacity: { duration: 0.18 },
        scale: { duration: 0.18 },
      },
    }),
  };

  return (
    <div className="auth-page relative min-h-[calc(100vh-64px)] w-full bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col justify-center overflow-x-hidden py-3 sm:py-8 lg:py-10 transition-colors duration-300" data-auth-mode={mode}>
      
      {/* 🌌 Theme-Responsive Ambient eSports Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-main)] via-[var(--bg-main)] to-[var(--bg-subtle)] opacity-95" />
        
        {/* Responsive Theme Grid Pattern */}
        <div className="auth-page-grid absolute inset-0 opacity-[0.03] sm:opacity-[0.04]" />
        
        {/* Dynamic Ambient Neon Glows */}
        <div className="auth-page-glow auth-page-glow-primary absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[550px] h-[280px] sm:h-[550px] blur-[100px] sm:blur-[140px] rounded-full pointer-events-none opacity-35 sm:opacity-40 transition-all duration-700" />
        <div className="auth-page-glow auth-page-glow-secondary absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[280px] sm:w-[550px] h-[280px] sm:h-[550px] blur-[120px] sm:blur-[160px] rounded-full pointer-events-none opacity-25 sm:opacity-30 transition-all duration-700" />
        <div className="auth-page-vignette absolute inset-0" />
      </div>

      {/* 🌟 MAIN eSPORTS CONTENT GRID */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-12 items-center my-auto">
        
        {/* 🏆 DESKTOP LEFT COLUMN: Holographic Arena & League Showcase */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center space-y-6">
          
          {/* Tactical HUD Header Tag */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--app-accent)] text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-[0_0_20px_var(--app-accent-soft)]">
              <span className="size-2 rounded-full bg-[var(--app-positive)] animate-ping" />
              <Activity className="w-3.5 h-3.5 text-[var(--app-accent)]" />
              <span>CIRCUITO COMPETITIVO // TEMPORADA 2026</span>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-[var(--app-accent-2-soft)] border border-[var(--app-accent-2)] text-[var(--app-accent-2)] text-[11px] font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[var(--app-warning)] animate-pulse" />
              <span>MATCHDAYS EN VIVO</span>
            </div>
          </div>

          {/* Hero eSports Typography */}
          <div className="space-y-2">
            <h1 className="text-4xl xl:text-5xl font-black text-[var(--text-heading)] uppercase tracking-tight leading-[1.05] drop-shadow-2xl">
              La Arena Pro de <br />
              <span className="bg-gradient-to-r from-[var(--app-accent)] via-[var(--app-accent-2)] to-[var(--app-warning)] bg-clip-text text-transparent">
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
            <div className="absolute -top-10 -left-10 size-64 bg-[var(--app-accent-soft)] blur-3xl pointer-events-none rounded-full" />
            <div className="absolute -bottom-10 -right-10 size-64 bg-[var(--app-accent-2-soft)] blur-3xl pointer-events-none rounded-full" />

            {/* Left: 3D Live Trophy Canvas */}
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <HologramStage3D size={210} glowColor="var(--app-accent)" accentColor="var(--app-accent-2)" />
              <div className="absolute -bottom-2 text-[10px] font-bold text-[var(--app-accent)] uppercase tracking-widest bg-[var(--bg-elevated)] px-3 py-0.5 rounded-full border border-[var(--border-card)] shadow-lg">
                ★ 3D CHAMPIONS TROPHY ★
              </div>
            </div>

            {/* Right: Live eSports Stats & Disciplines */}
            <div className="space-y-4 flex-1">
              <div>
                <span className="text-[10px] font-extrabold text-[var(--app-accent)] uppercase tracking-widest">
                  [ PLATAFORMA VERIFICADA ]
                </span>
                <h3 className="text-base font-black text-[var(--text-heading)] uppercase tracking-tight mt-0.5">
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
                      data-game={item.slug}
                      className="p-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] hover:border-[var(--border-card-hover)] transition-colors flex items-center gap-2"
                    >
                      <div className="auth-discipline-icon size-7 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5" />
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
              <div className="flex items-center justify-between pt-1 text-xs border-t border-[var(--border-card)]">
                <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-[var(--app-accent)]" />
                  +120 Ligas Oficiales
                </span>
                <span className="text-[var(--app-positive)] font-bold flex items-center gap-1">
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
                <div className="size-6 rounded-lg bg-[var(--app-accent-soft)] border border-[var(--app-accent)] flex items-center justify-center">
                  <Trophy className="w-3.5 h-3.5 text-[var(--app-accent)]" />
                </div>
                <span className="text-xs font-black text-[var(--text-heading)] uppercase">Fixtures Pro</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">
                Generación automática y actas.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--border-card-hover)] backdrop-blur-md transition-all duration-300 hover:translate-y-[-2px] space-y-1">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-lg bg-[var(--app-accent-2-soft)] border border-[var(--app-accent-2)] flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5 text-[var(--app-accent-2)]" />
                </div>
                <span className="text-xs font-black text-[var(--text-heading)] uppercase">Mercado Libre</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">
                Contratación y agentes libres.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--border-card-hover)] backdrop-blur-md transition-all duration-300 hover:translate-y-[-2px] space-y-1">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-lg bg-[var(--app-warning-soft)] border border-[var(--app-warning)] flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-[var(--app-warning)]" />
                </div>
                <span className="text-xs font-black text-[var(--text-heading)] uppercase">Clubes & Stats</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">
                Perfiles con ranking ELO oficial.
              </p>
            </div>
          </div>
        </div>

        {/* 📱 MOBILE BRAND HEADER (Visible only on < lg screens) */}
        <div className="w-full lg:hidden flex flex-col items-center text-center space-y-2 pt-1 pb-1">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="size-10 rounded-xl bg-gradient-to-br from-[var(--app-accent)] via-[var(--app-accent-2)] to-[var(--app-warning)] p-0.5 shadow-lg group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[var(--bg-elevated)] rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[var(--app-accent)]" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-black tracking-tight text-[var(--text-heading)] uppercase leading-none">
                TOURNAMENTS<span className="text-[var(--app-accent)]">PRO</span>
              </span>
              <span className="text-[9px] text-[var(--text-muted)] font-bold tracking-wider uppercase mt-0.5">
                ARENA DEPORTIVA SUDAMÉRICA
              </span>
            </div>
          </Link>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] text-[10px] font-bold text-[var(--app-accent)] shadow-sm">
            <span className="size-1.5 rounded-full bg-[var(--app-positive)] animate-pulse" />
            <span>CIRCUITO OFICIAL 2026 // ACCESO ATLETAS</span>
          </div>
        </div>

        {/* 🔐 RIGHT COLUMN: 3D Tilt Morphing Auth Card (Login <-> Register) */}
        <div className="w-full lg:col-span-6 xl:col-span-5 flex justify-center">
          <Card3D
            maxTilt={6}
            glareEffect={true}
            neonBorder={true}
            className="w-full max-w-lg shadow-2xl rounded-3xl"
          >
            <div className="p-4 sm:p-7 md:p-8 space-y-3.5 sm:space-y-5">
              
              {/* Top Mode Segmented Switcher Tab (Mobile Touch Optimized) */}
              <Card3DItem depth={20}>
                <div className="relative p-1 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-card)] flex items-center justify-between shadow-inner">
                  
                  {/* Login Tab Button */}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`relative z-10 flex-1 min-h-[44px] py-2 rounded-xl text-xs sm:text-xs font-black uppercase tracking-wider transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                      mode === 'login'
                        ? 'text-[var(--text-heading)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {mode === 'login' && (
                      <motion.div
                        layoutId="active-auth-tab"
                        className="absolute inset-0 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card-hover)] shadow-md -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <LogIn className={`w-4 h-4 ${mode === 'login' ? 'text-[var(--app-accent)]' : 'text-[var(--text-muted)]'}`} />
                    <span>Iniciar Sesión</span>
                  </button>

                  {/* Register Tab Button */}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className={`relative z-10 flex-1 min-h-[44px] py-2 rounded-xl text-xs sm:text-xs font-black uppercase tracking-wider transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                      mode === 'register'
                        ? 'text-[var(--text-heading)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {mode === 'register' && (
                      <motion.div
                        layoutId="active-auth-tab"
                        className="absolute inset-0 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card-hover)] shadow-md -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <UserPlus className={`w-4 h-4 ${mode === 'register' ? 'text-[var(--app-accent-2)]' : 'text-[var(--text-muted)]'}`} />
                    <span>Crear Cuenta</span>
                  </button>
                </div>
              </Card3DItem>

              {/* Dynamic Animated Content Container */}
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                
                {/* ═══════════════ LOGIN MODE ═══════════════ */}
                {mode === 'login' ? (
                  <motion.div
                    key="login-form-pane"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-3.5 sm:space-y-4"
                  >
                    {/* Header Title (Subtle on Mobile) */}
                    <div className="text-center space-y-1 pt-0.5">
                      <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-[var(--text-heading)]">
                        Acceso a la Arena
                      </h2>
                      <p className="text-xs text-[var(--text-muted)] font-medium">
                        Ingresa con tu gamertag o redes oficiales
                      </p>
                    </div>

                    <AuthProviderButtons
                      googleLabel="Continuar con Google"
                      onGoogle={() => setIsGoogleModalOpen(true)}
                    />

                    {/* Divider with Cyber Text */}
                    <div className="relative flex items-center justify-center my-1">
                      <div className="w-full border-t border-[var(--border-card)]" />
                      <span className="absolute bg-[var(--bg-card)] px-3 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                        O con credenciales
                      </span>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLoginSubmit} className="space-y-3 sm:space-y-3.5">
                      {/* Gamertag / Email */}
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider">
                          Gamertag o Correo Electrónico
                        </label>
                        <div className="relative group">
                          <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--app-accent)] transition-colors pointer-events-none" />
                          <input
                            type="text"
                            required
                            placeholder="ej. SrDeLorean o capitan@esports.com"
                            value={loginEmail}
                            onChange={(e) => {
                              setLoginEmail(e.target.value);
                              if (authError) setAuthError(null);
                            }}
                            className="w-full min-h-[48px] sm:min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-sm sm:text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent-soft)] transition-all"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider">
                            Contraseña
                          </label>
                          <a
                            href="#"
                            className="text-[11px] font-bold text-[var(--app-accent)] hover:brightness-125 transition-colors p-1"
                          >
                            ¿Olvidaste?
                          </a>
                        </div>
                        <div className="relative group">
                          <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--app-accent)] transition-colors pointer-events-none" />
                          <input
                            type={loginShowPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••••••"
                            value={loginPassword}
                            onChange={(e) => {
                              setLoginPassword(e.target.value);
                              if (authError) setAuthError(null);
                            }}
                            className="w-full min-h-[48px] sm:min-h-[44px] pl-10 pr-12 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-sm sm:text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent-soft)] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setLoginShowPassword(!loginShowPassword)}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                            aria-label={loginShowPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                          >
                            {loginShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Remember Me & Security */}
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <label className="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)] font-medium select-none py-1">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="size-4 rounded bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--app-accent)] focus:ring-0 cursor-pointer"
                          />
                          <span>Recordar sesión</span>
                        </label>
                        <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                          <Shield className="w-3 h-3 text-[var(--app-positive)] shrink-0" />
                          SSL SEGURO
                        </span>
                      </div>

                      {/* Error Banner */}
                      {authError && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2.5 rounded-xl border border-[var(--app-danger)] bg-[var(--app-danger-soft)] p-3 text-xs font-semibold text-[var(--app-danger)] shadow-md"
                        >
                          <AlertCircle className="size-4 shrink-0 mt-0.5 text-[var(--app-danger)]" />
                          <span>{authError}</span>
                        </motion.div>
                      )}

                      {/* Submit Button (Thumb Optimized) */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="relative w-full min-h-[50px] sm:min-h-[46px] h-12 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest text-[var(--accent-contrast)] bg-gradient-to-r from-[var(--app-accent)] via-[var(--app-positive)] to-[var(--app-accent)] hover:brightness-110 transition-all duration-300 shadow-[0_0_25px_var(--app-accent-soft)] hover:shadow-[0_0_35px_var(--app-accent-soft)] flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer"
                      >
                        <div className="auth-submit-shimmer absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
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
                    </form>

                    {/* Switcher Footer (Big Touch Target) */}
                    <div className="pt-2 text-center text-xs text-[var(--text-muted)] font-medium">
                      ¿Aún no tienes cuenta?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('register')}
                        className="font-bold text-[var(--app-accent)] hover:brightness-125 hover:underline transition-colors ml-1 py-1 inline-block cursor-pointer"
                      >
                        Crear cuenta eSports
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  
                  /* ═══════════════ REGISTER MODE ═══════════════ */
                  <motion.div
                    key="register-form-pane"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-3.5 sm:space-y-4"
                  >
                    {/* Header Title (Subtle on Mobile) */}
                    <div className="text-center space-y-1 pt-0.5">
                      <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-[var(--text-heading)]">
                        Crear Ficha de Atleta
                      </h2>
                      <p className="text-xs text-[var(--text-muted)] font-medium">
                        Compite en torneos, fichajes y lidera tu club
                      </p>
                    </div>

                    <AuthProviderButtons
                      googleLabel="Registrarse con Google"
                      onGoogle={() => setIsGoogleModalOpen(true)}
                    />

                    {/* Divider with Cyber Text */}
                    <div className="relative flex items-center justify-center my-1">
                      <div className="w-full border-t border-[var(--border-card)]" />
                      <span className="absolute bg-[var(--bg-card)] px-3 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                        o datos del atleta
                      </span>
                    </div>

                    {/* Register Form */}
                    <form onSubmit={handleRegisterSubmit} className="space-y-3 sm:space-y-3.5">
                      {/* Row 1: Gamertag & Full Name */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider">
                            Gamertag / Nick
                          </label>
                          <div className="relative group">
                            <Gamepad2 className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--app-accent)] transition-colors pointer-events-none" />
                            <input
                              type="text"
                              required
                              minLength={3}
                              maxLength={50}
                              autoComplete="nickname"
                              placeholder="ej. SrDeLorean"
                              value={gamertag}
                              onChange={(e) => {
                                setGamertag(e.target.value);
                                if (authError) setAuthError(null);
                              }}
                              className="w-full min-h-[48px] sm:min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-sm sm:text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent-soft)] transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider">
                            Nombre Completo
                          </label>
                          <div className="relative group">
                            <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--app-accent)] transition-colors pointer-events-none" />
                            <input
                              type="text"
                              required
                              maxLength={100}
                              autoComplete="name"
                              placeholder="ej. Sebastián Rodríguez"
                              value={fullName}
                              onChange={(e) => {
                                setFullName(e.target.value);
                                if (authError) setAuthError(null);
                              }}
                              className="w-full min-h-[48px] sm:min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-sm sm:text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent-soft)] transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider">
                          Correo Electrónico
                        </label>
                        <div className="relative group">
                          <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--app-accent)] transition-colors pointer-events-none" />
                          <input
                            type="email"
                            required
                            maxLength={191}
                            autoComplete="email"
                            placeholder="correo@ejemplo.com"
                            value={registerEmail}
                            onChange={(e) => {
                              setRegisterEmail(e.target.value);
                              if (authError) setAuthError(null);
                            }}
                            className="w-full min-h-[48px] sm:min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-sm sm:text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent-soft)] transition-all"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider">
                            Contraseña Segura
                          </label>
                          <span className="text-[10px] text-[var(--text-muted)]">Min. 10 car. (1 letra + 1 num)</span>
                        </div>
                        <div className="relative group">
                          <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--app-accent)] transition-colors pointer-events-none" />
                          <input
                            type={registerShowPassword ? 'text' : 'password'}
                            required
                            minLength={10}
                            maxLength={128}
                            autoComplete="new-password"
                            placeholder="••••••••••••"
                            value={registerPassword}
                            onChange={(e) => {
                              setRegisterPassword(e.target.value);
                              if (authError) setAuthError(null);
                            }}
                            className="w-full min-h-[48px] sm:min-h-[44px] pl-10 pr-12 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-sm sm:text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent-soft)] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setRegisterShowPassword(!registerShowPassword)}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                            aria-label={registerShowPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                          >
                            {registerShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Game & Platform */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider">
                            Juego Principal
                          </label>
                          <div className="relative">
                            <select
                              value={primaryGame}
                              onChange={(e) => setPrimaryGame(e.target.value)}
                              className="w-full min-h-[46px] sm:min-h-[42px] px-3.5 pr-8 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--app-accent)] appearance-none cursor-pointer"
                            >
                              {gamesList.map((g) => (
                                <option key={g.id} value={g.slug} className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                                  {g.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider">
                            Plataforma
                          </label>
                          <div className="relative">
                            <select
                              value={platform}
                              onChange={(e) => setPlatform(e.target.value)}
                              className="w-full min-h-[46px] sm:min-h-[42px] px-3.5 pr-8 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--app-accent)] appearance-none cursor-pointer"
                            >
                              <option value="PS5" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">PS5 (PlayStation 5)</option>
                              <option value="PS4" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">PS4 (PlayStation 4)</option>
                              <option value="XBOX" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">XBOX Series / One</option>
                              <option value="PC" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">PC (Computadora)</option>
                              <option value="CROSSPLAY" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">CROSSPLAY (Multiplataforma)</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Terms Checkbox */}
                      <div className="flex items-start gap-2 pt-1 text-xs text-[var(--text-secondary)] font-medium select-none py-1">
                        <input
                          type="checkbox"
                          required
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-0.5 size-4 rounded bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--app-accent)] focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[11px] sm:text-xs leading-relaxed">
                          Acepto los{' '}
                          <Link href="/informacion" className="font-bold text-[var(--app-accent)] hover:brightness-125 hover:underline">
                            Términos
                          </Link>{' '}
                          y política eSports.
                        </span>
                      </div>

                      {/* Error Banner */}
                      {authError && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2.5 rounded-xl border border-[var(--app-danger)] bg-[var(--app-danger-soft)] p-3 text-xs font-semibold text-[var(--app-danger)] shadow-md"
                        >
                          <AlertCircle className="size-4 shrink-0 mt-0.5 text-[var(--app-danger)]" />
                          <span>{authError}</span>
                        </motion.div>
                      )}

                      {/* Submit CTA Button (Thumb Optimized) */}
                      <button
                        type="submit"
                        disabled={isLoading || !acceptTerms}
                        className="relative w-full min-h-[50px] sm:min-h-[46px] h-12 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest text-[var(--accent-contrast)] bg-gradient-to-r from-[var(--app-accent)] via-[var(--app-positive)] to-[var(--app-accent)] hover:brightness-110 transition-all duration-300 shadow-[0_0_25px_var(--app-accent-soft)] hover:shadow-[0_0_35px_var(--app-accent-soft)] flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer"
                      >
                        <div className="auth-submit-shimmer absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="size-4 rounded-full border-2 border-[var(--accent-contrast)] border-t-transparent animate-spin" />
                            <span>Creando Perfil...</span>
                          </div>
                        ) : (
                          <>
                            <span>Completar Registro eSports</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Switcher Footer (Big Touch Target) */}
                    <div className="pt-2 text-center text-xs text-[var(--text-muted)] font-medium">
                      ¿Ya estás registrado?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="font-bold text-[var(--app-accent)] hover:brightness-125 hover:underline transition-colors ml-1 py-1 inline-block cursor-pointer"
                      >
                        Inicia sesión aquí
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
