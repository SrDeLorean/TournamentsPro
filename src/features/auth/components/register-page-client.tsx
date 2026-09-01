import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Mail,
  Lock,
  User,
  Gamepad2,
  ArrowRight,
  CheckCircle2,
  Tv,
  MessageSquare,
  Flame,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  Shield,
  Activity,
  Layers,
} from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games-data';
import { useAuth } from '@/components/providers/auth-provider';
import { buildRegistrationPayload, validateRegistrationForm } from '@/features/auth/lib/register-form';
import { GoogleOAuthModal } from '@/components/auth/google-oauth-modal';
import { Card3D, Card3DItem } from '@/components/3d/card-3d';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const gamesList = Object.values(GAMES_CATALOG);

  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const [gamertag, setGamertag] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [primaryGame, setPrimaryGame] = useState('eafc26');
  const [platform, setPlatform] = useState('PS5');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // Auto-scroll on initial load to focus on content
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) return;
    const formValues = {
      gamertag,
      fullName,
      email,
      password,
      primaryGame: primaryGame as 'eafc26' | 'valorant' | 'csgo' | 'lol' | 'rocketleague',
      platform: platform as 'PS5' | 'PS4' | 'XBOX' | 'PC' | 'CROSSPLAY',
    };
    const validationError = validateRegistrationForm(formValues);
    if (validationError) {
      setRegistrationError(validationError);
      return;
    }
    setRegistrationError(null);
    setIsLoading(true);
    const result = await register(buildRegistrationPayload(formValues));
    setIsLoading(false);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setRegistrationError(result.error || 'No fue posible completar el registro.');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col justify-center overflow-x-hidden py-4 sm:py-8 lg:py-10 transition-colors duration-300">
      
      {/* 🌌 Theme-Responsive Ambient eSports Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-main)] via-[var(--bg-main)] to-[var(--bg-subtle)] opacity-95" />
        {/* Subtle Theme Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, var(--accent-cyan) 1px, transparent 1px), linear-gradient(to bottom, var(--accent-cyan) 1px, transparent 1px)`,
            backgroundSize: '40px 40px' 
          }} 
        />
        {/* Dynamic Ambient Neon Glows matching active theme */}
        <div 
          className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] blur-[140px] rounded-full pointer-events-none opacity-35" 
          style={{ background: 'var(--accent-cyan)' }}
        />
        <div 
          className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] blur-[160px] rounded-full pointer-events-none opacity-30" 
          style={{ background: 'var(--accent-violet)' }}
        />
        <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_0%,rgba(0,0,0,0.5)_90%]" />
      </div>

      {/* 🌟 MAIN REGISTRATION CONTENT GRID */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center my-auto">
        
        {/* 🏆 LEFT COLUMN: eSports Brand Hero Banner (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6">
          
          {/* Tactical HUD Header Tag */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--accent-cyan)] text-xs font-mono font-black uppercase tracking-wider backdrop-blur-md shadow-[0_0_20px_var(--accent-cyan-bg)]">
              <span className="size-2 rounded-full bg-[var(--accent-emerald)] animate-ping" />
              <Activity className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
              <span>CIRCUITO COMPETITIVO // TEMPORADA 2026</span>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-[var(--accent-violet-bg)] border border-[var(--accent-violet)] text-[var(--accent-violet)] text-[11px] font-mono font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[var(--accent-gold)] animate-pulse" />
              <span>REGISTRO OFICIAL</span>
            </div>
          </div>

          {/* Hero Typography */}
          <div className="space-y-3">
            <h1 className="text-4xl xl:text-5xl font-black text-[var(--text-heading)] uppercase tracking-tight leading-[1.08] drop-shadow-2xl font-display">
              Crea tu Ficha Oficial de <br />
              <span className="bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-violet)] to-[var(--accent-gold)] bg-clip-text text-transparent">
                Atleta o Club eSports
              </span>
            </h1>
            <p className="text-sm xl:text-base text-[var(--text-secondary)] font-medium leading-relaxed max-w-lg">
              Inscribe tu plantilla, publica solicitudes en la Agencia Libre y compite por los premios en metálico de los campeonatos oficiales de Sudamérica.
            </p>
          </div>

          {/* Feature Highlight Cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--border-card-hover)] backdrop-blur-md transition-all duration-300 space-y-1">
              <span className="text-[var(--accent-cyan)] font-extrabold text-xs flex items-center gap-1.5 uppercase">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent-cyan)]" />
                Ficha Personal
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-medium block">
                Estadísticas ELO y Gamertag oficial verificado
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--border-card-hover)] backdrop-blur-md transition-all duration-300 space-y-1">
              <span className="text-[var(--accent-violet)] font-extrabold text-xs flex items-center gap-1.5 uppercase">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent-violet)]" />
                Gestión de Club
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-medium block">
                Capitanías, traspasos y actas de partido
              </span>
            </div>
          </div>

          {/* Verification Shield Info Banner */}
          <div className="flex items-start gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] backdrop-blur-md p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[var(--accent-cyan)]" />
            <div className="space-y-0.5">
              <p className="text-xs font-black uppercase tracking-wide text-[var(--text-heading)]">Cuenta de Atleta Verificada</p>
              <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                Tendrás acceso inmediato a la bolsa de fichajes, fixture de partidas y estadísticas en vivo con protección anti-trampas.
              </p>
            </div>
          </div>
        </div>

        {/* 📝 RIGHT COLUMN: 3D Tilt Register Card (Mobile & Desktop Responsive) */}
        <div className="w-full lg:col-span-6 flex justify-center">
          <Card3D
            maxTilt={6}
            glareEffect={true}
            neonBorder={true}
            className="w-full max-w-lg shadow-2xl"
          >
            <div className="p-5 sm:p-7 md:p-8 space-y-4 sm:space-y-5">
              
              {/* Card Header */}
              <Card3DItem depth={25}>
                <div className="text-center space-y-1.5">
                  <div className="relative mx-auto size-12 sm:size-14 rounded-2xl bg-gradient-to-br from-[var(--accent-cyan)] via-[var(--accent-violet)] to-[var(--accent-gold)] p-0.5 shadow-[0_0_25px_var(--accent-cyan-bg)] flex items-center justify-center">
                    <div className="w-full h-full bg-[var(--bg-elevated)] rounded-[14px] flex items-center justify-center">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-cyan)] animate-pulse" />
                    </div>
                    <div className="absolute -inset-1 rounded-2xl bg-[var(--accent-cyan-bg)] blur-md pointer-events-none -z-10" />
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-black text-[var(--accent-cyan)] uppercase tracking-widest block">
                      [ REGISTRO DE ATLETAS ]
                    </span>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-[var(--text-heading)] font-display">
                      Crear Cuenta eSports
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                      Compite en torneos, publica fichajes y lidera tu escuadra
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
                  <span className="truncate">Registrarse con Google</span>
                </button>
              </Card3DItem>

              {/* Social Registration OAuth */}
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
                  o datos del perfil
                </span>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                
                {/* Row 1: Gamertag & Full Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Gamertag */}
                  <Card3DItem depth={10} className="space-y-1">
                    <label className="text-xs font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider font-display">
                      Gamertag / Nick In-Game
                    </label>
                    <div className="relative group">
                      <Gamepad2 className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--accent-cyan)] transition-colors pointer-events-none" />
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
                          if (registrationError) setRegistrationError(null);
                        }}
                        className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-sm sm:text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-2 focus:ring-[var(--accent-cyan-bg)] transition-all"
                      />
                    </div>
                  </Card3DItem>

                  {/* Full Name */}
                  <Card3DItem depth={10} className="space-y-1">
                    <label className="text-xs font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider font-display">
                      Nombre Completo
                    </label>
                    <div className="relative group">
                      <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--accent-cyan)] transition-colors pointer-events-none" />
                      <input
                        type="text"
                        required
                        maxLength={100}
                        autoComplete="name"
                        placeholder="ej. Sebastián Rodríguez"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (registrationError) setRegistrationError(null);
                        }}
                        className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-sm sm:text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-2 focus:ring-[var(--accent-cyan-bg)] transition-all"
                      />
                    </div>
                  </Card3DItem>
                </div>

                {/* Email */}
                <Card3DItem depth={10} className="space-y-1">
                  <label className="text-xs font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider font-display">
                    Correo Electrónico
                  </label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--accent-cyan)] transition-colors pointer-events-none" />
                    <input
                      type="email"
                      required
                      maxLength={191}
                      autoComplete="email"
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (registrationError) setRegistrationError(null);
                      }}
                      className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-sm sm:text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] focus:ring-2 focus:ring-[var(--accent-cyan-bg)] transition-all"
                    />
                  </div>
                </Card3DItem>

                {/* Password */}
                <Card3DItem depth={10} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider font-display">
                      Contraseña Segura
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)]">Mínimo 10 car. (1 letra y 1 número)</span>
                  </div>
                  <div className="relative group">
                    <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--accent-cyan)] transition-colors pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={10}
                      maxLength={128}
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (registrationError) setRegistrationError(null);
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

                {/* Row 2: Game & Platform Preferences */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Card3DItem depth={10} className="space-y-1">
                    <label className="text-[11px] font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider">
                      Juego Principal
                    </label>
                    <select
                      value={primaryGame}
                      onChange={(e) => setPrimaryGame(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)]"
                    >
                      {gamesList.map((g) => (
                        <option key={g.id} value={g.slug} className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </Card3DItem>

                  <Card3DItem depth={10} className="space-y-1">
                    <label className="text-[11px] font-extrabold text-[var(--text-secondary)] block uppercase tracking-wider">
                      Plataforma
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-card)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)]"
                    >
                      <option value="PS5" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">PS5 (PlayStation 5)</option>
                      <option value="PS4" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">PS4 (PlayStation 4)</option>
                      <option value="XBOX" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">XBOX Series / One</option>
                      <option value="PC" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">PC (Computadora)</option>
                      <option value="CROSSPLAY" className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">CROSSPLAY (Multiplataforma)</option>
                    </select>
                  </Card3DItem>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start gap-2 pt-1 text-xs text-[var(--text-secondary)] font-medium select-none">
                  <input
                    type="checkbox"
                    required
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 size-4 rounded bg-[var(--bg-subtle)] border-[var(--border-card)] text-[var(--accent-cyan)] focus:ring-0 cursor-pointer"
                  />
                  <span>
                    Acepto los{' '}
                    <Link href="/informacion" className="font-bold text-[var(--accent-cyan)] hover:brightness-125 hover:underline">
                      Términos de Servicio
                    </Link>{' '}
                    y la política de privacidad eSports.
                  </span>
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                  {registrationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      role="alert"
                      className="flex items-start gap-2.5 rounded-xl border border-[var(--accent-crimson)] bg-[var(--accent-crimson-bg)] p-3 text-xs font-semibold text-[var(--accent-crimson)] shadow-md backdrop-blur-md"
                    >
                      <AlertCircle className="size-4 shrink-0 mt-0.5 text-[var(--accent-crimson)]" />
                      <span>{registrationError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit CTA Button */}
                <Card3DItem depth={20} className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !acceptTerms}
                    className="relative w-full min-h-[46px] h-12 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest text-[var(--accent-contrast)] bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-emerald)] to-[var(--accent-cyan)] hover:brightness-110 transition-all duration-300 shadow-[0_0_25px_var(--accent-cyan-bg)] hover:shadow-[0_0_35px_var(--accent-cyan-bg)] flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

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
                </Card3DItem>
              </form>

              {/* Footer Login Link */}
              <Card3DItem depth={5}>
                <div className="pt-1 text-center text-xs text-[var(--text-muted)] font-medium">
                  ¿Ya estás registrado?{' '}
                  <Link
                    href="/login"
                    className="font-bold text-[var(--accent-cyan)] hover:brightness-125 hover:underline transition-colors ml-1"
                  >
                    Inicia sesión aquí
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
