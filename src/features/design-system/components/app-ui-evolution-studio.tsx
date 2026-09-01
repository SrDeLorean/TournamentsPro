'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  CircleUserRound,
  Command,
  LayoutDashboard,
  Plus,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
  WandSparkles,
  Smartphone,
  Monitor,
  Copy,
  Activity,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppCommandBar, AppEntityRow, AppMetricCard } from '@/components/ui/app-primitives';
import { cn } from '@/lib/utils';

type EvolutionLevel = 'base' | 'refined' | 'specialized';

export const APP_PALETTES = [
  {
    id: 'graphite-cyan', name: 'Graphite Cyan', note: 'Precisa, sobria y tecnológica', recommended: true,
    colors: ['#38D9F2', '#7C8CFF', '#34D399', '#F8FAFC'],
    vars: { '--app-accent': '#38D9F2', '--app-accent-2': '#7C8CFF', '--app-positive': '#34D399', '--app-warm': '#F6B94A', '--app-canvas': '#060A11', '--app-surface': '#0C1420', '--app-surface-2': '#121E2D', '--app-ink': '#F8FAFC' },
  },
  {
    id: 'midnight-iris', name: 'Midnight Iris', note: 'Editorial, premium y competitivo',
    colors: ['#A78BFA', '#F472D0', '#67E8F9', '#FFF7ED'],
    vars: { '--app-accent': '#A78BFA', '--app-accent-2': '#F472D0', '--app-positive': '#5EEAD4', '--app-warm': '#FBBF24', '--app-canvas': '#0A0712', '--app-surface': '#151022', '--app-surface-2': '#211631', '--app-ink': '#FFF7FF' },
  },
  {
    id: 'titanium-mint', name: 'Titanium Mint', note: 'Limpia, táctica y accesible',
    colors: ['#5EEAD4', '#60A5FA', '#A3E635', '#F1F5F9'],
    vars: { '--app-accent': '#5EEAD4', '--app-accent-2': '#60A5FA', '--app-positive': '#A3E635', '--app-warm': '#FACC15', '--app-canvas': '#06100F', '--app-surface': '#0C1B19', '--app-surface-2': '#122925', '--app-ink': '#F1F5F9' },
  },
  {
    id: 'solar-carbon', name: 'Solar Carbon', note: 'Enérgica, cálida y de alto contraste',
    colors: ['#FBBF24', '#FB7185', '#22D3EE', '#FFFBEB'],
    vars: { '--app-accent': '#FBBF24', '--app-accent-2': '#FB7185', '--app-positive': '#4ADE80', '--app-warm': '#F97316', '--app-canvas': '#0D0B07', '--app-surface': '#19150D', '--app-surface-2': '#2A2111', '--app-ink': '#FFFBEB' },
  },
] as const;

const LEVELS: { id: EvolutionLevel; eyebrow: string; name: string; detail: string }[] = [
  { id: 'base', eyebrow: '01 · Fundamento', name: 'Base funcional', detail: 'Jerarquía clara y controles consistentes.' },
  { id: 'refined', eyebrow: '02 · Sistema', name: 'Refinado', detail: 'Mejor densidad, estados y profundidad.' },
  { id: 'specialized', eyebrow: '03 · Producto', name: 'Especializado', detail: 'Contexto, acciones rápidas y datos vivos.' },
];

function EvolutionPreview({ level, isMobileFrame }: { level: EvolutionLevel; isMobileFrame?: boolean }) {
  const [query, setQuery] = useState('');
  const specialized = level === 'specialized';
  const refined = level !== 'base';

  return (
    <div className={cn('app-evolution-preview transition-all duration-300', `is-${level}`, isMobileFrame && 'max-w-[340px] mx-auto rounded-3xl border-2 border-[var(--app-accent)] shadow-2xl overflow-hidden')}>
      <div className="app-preview-topbar">
        <span className="app-preview-brand"><Trophy className="w-4 h-4" /> <strong>TOURNAMENTS<span>PRO</span></strong></span>
        <nav aria-label={`Navegación de muestra ${level}`}>
          <button className="is-active"><LayoutDashboard className="w-3.5 h-3.5" /> {!isMobileFrame && 'Gestión'}</button>
          <button><Bell className="w-3.5 h-3.5" /> {!isMobileFrame && 'Alertas'}</button>
          <button><CircleUserRound className="w-3.5 h-3.5" /> {!isMobileFrame && 'Cuenta'}</button>
        </nav>
      </div>

      <div className="app-preview-heading">
        <div>
          <small>{specialized ? 'CENTRO DE OPERACIONES · EN VIVO' : 'GESTIÓN DE COMPETENCIAS'}</small>
          <h3>{specialized ? 'Control competitivo' : 'Panel principal'}</h3>
          <p>{refined ? 'Información priorizada para decidir más rápido.' : 'Resumen general de la plataforma.'}</p>
        </div>
        <Button size="sm"><Plus className="w-3.5 h-3.5 mr-1" /> {isMobileFrame ? 'Crear' : 'Crear torneo'}</Button>
      </div>

      <div className="app-preview-metrics">
        <AppMetricCard label="Torneos activos" value="08" detail="3 en inscripción" trend={refined ? '+12%' : undefined} icon={<Trophy />} />
        <AppMetricCard label="Atletas" value="248" detail="96% verificados" icon={<UsersRound />} tone="violet" />
        {refined ? <AppMetricCard label="Operación" value="99.8%" detail="Servicios estables" icon={<ShieldCheck />} tone="emerald" /> : null}
      </div>

      {refined ? (
        <AppCommandBar
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar equipo, atleta o copa..."
          resultLabel="24 resultados"
          filters={<button className="cursor-pointer">Estado <ChevronDown className="w-3.5 h-3.5 ml-1 inline" /></button>}
        />
      ) : (
        <label className="app-preview-basic-search">Buscar <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre..." /></label>
      )}

      <div className="app-preview-list">
        <div className="app-preview-list-title"><strong>Actividad reciente</strong><span>Actualizado ahora</span></div>
        <AppEntityRow avatar="LY" title="LeguaYork eSports" subtitle="EA FC 26 · Primera división" meta={specialized ? 'Siguiente: 21:30' : '16 jugadores'} status="Activo" actions={specialized ? <Button variant="ghost" size="sm">Abrir</Button> : undefined} />
        <AppEntityRow avatar="SN" title="Sangre Nueva FC" subtitle="Solicitud de inscripción" meta={specialized ? 'Revisión pendiente' : 'Hace 8 min'} status={specialized ? 'Prioridad' : 'Nuevo'} actions={specialized ? <Button variant="outline" size="sm">Revisar</Button> : undefined} />
      </div>
    </div>
  );
}

export function AppUiEvolutionStudio() {
  const [paletteId, setPaletteId] = useState<string>(APP_PALETTES[0].id);
  const [mobileLevel, setMobileLevel] = useState<EvolutionLevel>('specialized');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedTokens, setCopiedTokens] = useState<boolean>(false);

  const palette = useMemo(() => APP_PALETTES.find((item) => item.id === paletteId) ?? APP_PALETTES[0], [paletteId]);
  const paletteStyle = palette.vars as unknown as CSSProperties;

  const copyVars = () => {
    const cssText = Object.entries(palette.vars)
      .map(([k, v]) => `${k}: ${v};`)
      .join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cssText);
      setCopiedTokens(true);
      setTimeout(() => setCopiedTokens(false), 2000);
    }
  };

  return (
    <section className="app-ui-studio" style={paletteStyle} aria-labelledby="app-ui-studio-title">
      <header className="app-ui-studio-hero">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div>
            <span className="app-ui-studio-kicker"><WandSparkles className="w-3.5 h-3.5" /> Evolución del lenguaje visual</span>
            <h2 id="app-ui-studio-title">Una APP más clara, rápida y reconocible.</h2>
            <p>Este laboratorio afecta el sistema global —componentes, gestión y páginas públicas— sin modificar la identidad visual de cada gameSlug.</p>
          </div>

          {/* Viewport Mode Switcher & Stats */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--app-surface-2)] border border-[var(--border-card)]">
              <button
                type="button"
                onClick={() => setViewMode('desktop')}
                className={cn('px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer', viewMode === 'desktop' ? 'bg-[var(--app-accent)] text-black shadow-md' : 'text-[var(--text-muted)] hover:text-white')}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={cn('px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer', viewMode === 'mobile' ? 'bg-[var(--app-accent)] text-black shadow-md' : 'text-[var(--text-muted)] hover:text-white')}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Móvil</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
              <span className="flex items-center gap-1 text-[var(--app-positive)]"><Zap className="w-3 h-3" /> 60 FPS</span>
              <span>·</span>
              <span className="text-[var(--app-accent)]">WCAG AAA</span>
            </div>
          </div>
        </div>
      </header>

      {/* Palette Selector Lab */}
      <div className="app-palette-lab" aria-label="Paletas candidatas para la aplicación">
        <div className="app-palette-heading flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span><Sparkles className="w-4 h-4" /> Paleta de la APP</span>
            <p>Selecciona una propuesta para aplicarla instantáneamente a todos los ejemplos.</p>
          </div>

          <button
            type="button"
            onClick={copyVars}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-[var(--app-surface-2)] hover:bg-[var(--app-surface)] border border-[var(--border-card)] text-xs font-mono font-bold text-[var(--app-accent)] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedTokens ? <Check className="w-3.5 h-3.5 text-[var(--app-positive)]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedTokens ? '¡Variables copiadas!' : 'Copiar CSS Tokens'}</span>
          </button>
        </div>

        <div className="app-palette-options">
          {APP_PALETTES.map((item) => {
            const selected = item.id === paletteId;
            return (
              <button key={item.id} type="button" className={cn('app-palette-option cursor-pointer', selected && 'is-selected')} onClick={() => setPaletteId(item.id)} aria-pressed={selected}>
                <span className="app-palette-swatches">{item.colors.map((color) => <i key={color} style={{ background: color }} />)}</span>
                <span><strong>{item.name}</strong><small>{item.note}</small></span>
                {'recommended' in item && item.recommended ? <em>Recomendada</em> : null}
                {selected ? <Check className="app-palette-check" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="app-evolution-mobile-tabs" role="tablist" aria-label="Nivel de evolución">
        {LEVELS.map((level) => <button key={level.id} type="button" role="tab" aria-selected={mobileLevel === level.id} onClick={() => setMobileLevel(level.id)} className="cursor-pointer">{level.name}</button>)}
      </div>

      <div className={cn('app-evolution-grid', viewMode === 'mobile' && 'grid-cols-1 md:grid-cols-3 justify-items-center')}>
        {LEVELS.map((level) => (
          <article key={level.id} className={cn('app-evolution-stage w-full', mobileLevel === level.id && 'is-mobile-active')}>
            <header><small>{level.eyebrow}</small><strong>{level.name}</strong><p>{level.detail}</p></header>
            <EvolutionPreview level={level.id} isMobileFrame={viewMode === 'mobile'} />
          </article>
        ))}
      </div>

      <footer className="app-ui-studio-footer flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Command className="w-4 h-4 text-[var(--app-accent)]" />
          <span><strong>Componentes incluidos</strong><small className="ml-2 text-[var(--text-muted)]">Navbar · botones · métricas · buscador · filtros · filas · estados · modales · uploads</small></span>
        </div>
        <em className="font-mono text-xs text-[var(--app-accent)]">Paleta activa: {palette.name}</em>
      </footer>
    </section>
  );
}
