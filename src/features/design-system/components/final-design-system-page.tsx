'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import {
  Activity,
  BadgeCheck,
  Box,
  Check,
  ChevronRight,
  CircleAlert,
  Code2,
  Copy,
  Gauge,
  Grid3X3,
  Layers3,
  LoaderCircle,
  MousePointer2,
  Palette,
  Play,
  Ruler,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Type,
  X,
  Zap,
} from 'lucide-react';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { useDesign } from '@/components/providers/design-provider';
import { FONT_DEFINITIONS, DESIGN_FONTS, type DesignFont } from '@/lib/design-system';
import { GAMES_CATALOG, SYSTEM_SEMANTIC_PALETTE, type GameSemanticPalette } from '@/lib/games-data';
import { ComponentLibraryLab } from './component-library-lab';
import {
  MINOR_THIRD_SCALE,
  MOTION,
  MOTION_SAMPLE,
  QA,
  R3F_SAMPLE,
  RADIUS_LEVELS,
  SPACING_STEPS,
  TOKEN_SAMPLE,
} from './final-design-system-data';
import styles from './final-design-system-page.module.css';

type PreviewPaletteSlug = 'system' | 'valorant' | 'eafc26' | 'csgo' | 'lol' | 'rocketleague' | 'fortnite';

function SectionHeading({ number, eyebrow, title, description }: { number: string; eyebrow: string; title: string; description: string }) {
  return (
    <header className={styles.sectionHeading}>
      <span>{number}</span>
      <div><small>{eyebrow}</small><h2>{title}</h2><p>{description}</p></div>
    </header>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };
  return (
    <article className={styles.codeCard}>
      <header><span><Code2 />{title}</span><button type="button" onClick={copy}>{copied ? <Check /> : <Copy />}{copied ? 'Copiado' : 'Copiar'}</button></header>
      <pre><code>{code}</code></pre>
    </article>
  );
}

export default function FinalDesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [motionRun, setMotionRun] = useState(0);
  const [checks, setChecks] = useState<boolean[]>(() => QA.map(() => false));
  const completed = checks.filter(Boolean).length;

  // 🔤 Global Design & Typography State
  const { preferences, setPreferences } = useDesign();
  const currentFont: DesignFont = preferences.font || 'outfit';
  const currentFontDef = FONT_DEFINITIONS[currentFont] || FONT_DEFINITIONS.outfit;

  // 📐 Foundation Interactive State
  const [foundationTab, setFoundationTab] = useState<'spacing' | 'type' | 'radius' | 'color'>('spacing');
  const [activeSpaceIndex, setActiveSpaceIndex] = useState(3); // 16px default
  const [activeRadiusId, setActiveRadiusId] = useState<'control' | 'card' | 'hero' | 'pill'>('control');
  const [copiedSwatch, setCopiedSwatch] = useState<string | null>(null);
  const [previewPaletteSlug, setPreviewPaletteSlug] = useState<PreviewPaletteSlug>('system');

  const activeSpace = SPACING_STEPS[activeSpaceIndex];

  const isSystemPreview = previewPaletteSlug === 'system';
  const activePreviewPalette: GameSemanticPalette = isSystemPreview
    ? SYSTEM_SEMANTIC_PALETTE
    : GAMES_CATALOG[previewPaletteSlug]?.semanticPalette || SYSTEM_SEMANTIC_PALETTE;

  const dynamicColors = [
    { name: 'Brand Primary', token: '--app-accent', value: activePreviewPalette.brandPrimary, role: 'Acción principal, foco, estados activos', contrast: 'AAA 4.5:1+' },
    { name: 'Brand Secondary', token: '--app-accent-2', value: activePreviewPalette.brandSecondary, role: 'Acción secundaria, gradientes de marca', contrast: 'AAA 7.0:1+' },
    { name: 'Brand Deep', token: '--brand-900', value: activePreviewPalette.brandDeep, role: 'Profundidad de escena, sombras tonales', contrast: 'AAA 12:1+' },
    { name: 'Success / Confirm', token: '--accent-success', value: activePreviewPalette.success, role: 'Victorias, clasificaciones, confirmación', contrast: 'AAA 4.8:1+' },
    { name: 'Warning / Attention', token: '--accent-warning', value: activePreviewPalette.warning, role: 'Atención, advertencias de partido, timeouts', contrast: 'AAA 4.5:1+' },
    { name: 'Danger / Penalty', token: '--accent-crimson', value: activePreviewPalette.danger, role: 'Eliminaciones, faltas graves, suspensiones', contrast: 'AAA 4.5:1+' },
    { name: 'Canvas Base', token: '--bg-main', value: activePreviewPalette.canvas, role: 'Fondo de pantalla y lienzo maestro', contrast: 'Fondo' },
    { name: 'Surface Elevated', token: '--bg-card', value: activePreviewPalette.surface, role: 'Tarjetas, paneles interactivos, modales', contrast: 'Superficie' },
    { name: 'Steel Border', token: '--border-card', value: activePreviewPalette.border, role: 'Contornos nítidos de interfaz de alta resolución', contrast: 'Borde' },
  ];

  useEffect(() => {
    if (!modalOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModalOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [modalOpen]);

  const toggleCheck = (index: number) => {
    setChecks((current) => current.map((value, itemIndex) => itemIndex === index ? !value : value));
  };

  const copyColor = async (colorVal: string) => {
    try {
      await navigator.clipboard.writeText(colorVal);
      setCopiedSwatch(colorVal);
      window.setTimeout(() => setCopiedSwatch(null), 1400);
    } catch {
      // clipboard fallback
    }
  };

  return (
    <main className={styles.page}>
      {/* ── TOP HERO SECTION ── */}
      <section className={styles.hero} id="top">
        <div className={styles.heroGrid} />
        <div className={styles.heroCopy}>
          <div className={styles.kicker}><Sparkles />TournamentsPro · Design System 3.0</div>
          <h1>Una interfaz con <strong>peso, ritmo y propósito.</strong></h1>
          <p>Sistema visual definitivo para crear experiencias competitivas coherentes, accesibles y expresivas bajo una estandarización matemática unificada.</p>
          <div className={styles.heroActions}>
            <a href="#foundations">Explorar fundamentos <ChevronRight /></a>
            <button type="button" onClick={() => setModalOpen(true)}>Ver modal estandarizado</button>
          </div>
          <div className={styles.heroSignals}>
            <span><ShieldCheck />WCAG AAA</span>
            <span><Type />Fuente {currentFontDef.name} Global</span>
            <span><Gauge />60 FPS</span>
            <span><Layers3 />3 temas</span>
            <span><Palette />Arte CSS Puro</span>
          </div>
        </div>
        <div className={styles.heroScene}>
          <div className={styles.staticEmblem} aria-hidden="true"><span /><span /><span /><i /><strong>TP</strong></div>
          <div className={styles.sceneCaption}><span>STATIC SYSTEM</span><strong>Design Core</strong><small>{currentFontDef.name} · Escala matemática 1.200</small></div>
        </div>
      </section>

      {/* ── STICKY ANCHOR NAVIGATION ── */}
      <nav className={styles.anchorNav} aria-label="Secciones del sistema">
        <a className={styles.anchorBrand} href="#top"><Sparkles /><span>TP</span> UI</a>
        <a href="#foundations">01 Fundamentos</a>
        <a href="#components">02 Componentes</a>
        <a href="#motion">03 Movimiento</a>
        <a href="#depth">04 Profundidad</a>
        <a href="#implementation">05 Implementación</a>
        <a href="#quality">06 Calidad</a>
        <div><ThemeSwitcher /></div>
      </nav>

      {/* ── 01 FOUNDATION LAYER (ESTANDARIZACIÓN MATEMÁTICA) ── */}
      <section className={styles.section} id="foundations">
        <SectionHeading
          number="01"
          eyebrow="Foundation layer"
          title="Estandarización matemática"
          description="Cada decisión visual parte de una escala predecible. Menos excepciones producen una interfaz más rápida de construir y más fácil de reconocer."
        />

        {/* 4 Pillars Summary Cards */}
        <div className={styles.principleGrid}>
          <article>
            <Grid3X3 />
            <span>4 / 8 px</span>
            <h3>Spacing grid</h3>
            <p>Los controles usan múltiplos de 4; las estructuras y separaciones mayores usan múltiplos de 8.</p>
          </article>
          <article>
            <Type />
            <span>1.200</span>
            <h3>Minor third</h3>
            <p>La escala tipográfica combina proporción 1.2 en fuente única Outfit con tamaños fluidos mediante <code>clamp()</code>.</p>
          </article>
          <article>
            <Ruler />
            <span>12 → 24</span>
            <h3>Radius ladder</h3>
            <p>12 px para controles, 16 px para tarjetas, 24 px para héroes y píldoras únicamente semánticas.</p>
          </article>
          <article>
            <Palette />
            <span>AAA</span>
            <h3>Color semántico</h3>
            <p>Los componentes consumen intención —acción, éxito, advertencia— y nunca un hexadecimal aislado.</p>
          </article>
        </div>

        {/* Interactive Foundation Studio Matrix */}
        <div className={styles.foundationInteractiveStage}>
          <div className={styles.foundationTabs} role="tablist" aria-label="Visualizadores de Fundamentos">
            <button
              id="foundation-tab-spacing"
              type="button"
              role="tab"
              aria-selected={foundationTab === 'spacing'}
              aria-controls="foundation-panel-spacing"
              tabIndex={foundationTab === 'spacing' ? 0 : -1}
              onClick={() => setFoundationTab('spacing')}
              className={`${styles.foundationTabBtn} ${foundationTab === 'spacing' ? styles.isTabActive : ''}`}
            >
              <Grid3X3 />
              <span>01. Spacing Grid (4 / 8 px)</span>
            </button>
            <button
              id="foundation-tab-type"
              type="button"
              role="tab"
              aria-selected={foundationTab === 'type'}
              aria-controls="foundation-panel-type"
              tabIndex={foundationTab === 'type' ? 0 : -1}
              onClick={() => setFoundationTab('type')}
              className={`${styles.foundationTabBtn} ${foundationTab === 'type' ? styles.isTabActive : ''}`}
            >
              <Type />
              <span>02. Tipografía Global & Escala ({currentFontDef.name})</span>
            </button>
            <button
              id="foundation-tab-radius"
              type="button"
              role="tab"
              aria-selected={foundationTab === 'radius'}
              aria-controls="foundation-panel-radius"
              tabIndex={foundationTab === 'radius' ? 0 : -1}
              onClick={() => setFoundationTab('radius')}
              className={`${styles.foundationTabBtn} ${foundationTab === 'radius' ? styles.isTabActive : ''}`}
            >
              <Ruler />
              <span>03. Escalera de Radios (12 → 24 px)</span>
            </button>
            <button
              id="foundation-tab-color"
              type="button"
              role="tab"
              aria-selected={foundationTab === 'color'}
              aria-controls="foundation-panel-color"
              tabIndex={foundationTab === 'color' ? 0 : -1}
              onClick={() => setFoundationTab('color')}
              className={`${styles.foundationTabBtn} ${foundationTab === 'color' ? styles.isTabActive : ''}`}
            >
              <Palette />
              <span>04. Paleta Semántica AAA</span>
            </button>
          </div>

          {/* TAB 1: SPACING GRID INTERACTIVE */}
          {foundationTab === 'spacing' && (
            <article
              id="foundation-panel-spacing"
              role="tabpanel"
              aria-labelledby="foundation-tab-spacing"
              className={styles.foundationDisplayPanel}
            >
              <div className={styles.foundationDisplayHeader}>
                <div>
                  <small>INTERACTIVE SPACING RULER</small>
                  <h3>Cuadrícula Matemática Base 4 / 8 px</h3>
                  <p>Selecciona un paso de la escala para inspeccionar su valor en píxeles, rem, token CSS asignado y regla de aplicación en los componentes.</p>
                </div>
              </div>

              <div className={styles.spacingScaleControls}>
                {SPACING_STEPS.map((s, idx) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setActiveSpaceIndex(idx)}
                    className={`${styles.spacingPill} ${activeSpaceIndex === idx ? styles.isPillActive : ''}`}
                  >
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>

              <div className={styles.spacingLiveArena}>
                <div className={styles.spacingVisualBox}>
                  <div
                    className={styles.spacingTargetBlock}
                    style={{
                      width: `${Math.min(Math.max(activeSpace.px * 3.5, 48), 340)}px`,
                      height: `${Math.min(Math.max(activeSpace.px * 3.5, 48), 180)}px`,
                    }}
                  >
                    <span>{activeSpace.px} px</span>
                  </div>
                </div>

                <div className={styles.spacingDataSheet}>
                  <div className={styles.spacingDataRow}>
                    <dt>Token CSS</dt>
                    <dd><code>{activeSpace.token}</code></dd>
                  </div>
                  <div className={styles.spacingDataRow}>
                    <dt>Valor en Rem</dt>
                    <dd>{activeSpace.rem} ({activeSpace.px} px)</dd>
                  </div>
                  <div className={styles.spacingDataRow}>
                    <dt>Cálculo Base</dt>
                    <dd>{activeSpace.px % 8 === 0 ? `Múltiplo de 8 (${activeSpace.px / 8} × 8px)` : `Múltiplo de 4 (${activeSpace.px / 4} × 4px)`}</dd>
                  </div>
                  <div className={styles.spacingDataRow}>
                    <dt>Aplicación Estándar</dt>
                    <dd>{activeSpace.use}</dd>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* TAB 2: MINOR THIRD TYPOGRAPHY & GLOBAL FONT ENGINE */}
          {foundationTab === 'type' && (
            <article
              id="foundation-panel-type"
              role="tabpanel"
              aria-labelledby="foundation-tab-type"
              className={styles.foundationDisplayPanel}
            >
              <div className={styles.foundationDisplayHeader}>
                <div>
                  <small>FLUID TYPOGRAPHY SCALE & GLOBAL FONT ENGINE</small>
                  <h3>Tipografía Global & Escala Minor Third (1.200)</h3>
                  <p>
                    Selecciona una de las tipografías de élite evaluadas para la plataforma eSports.
                    Al hacer clic, la fuente elegida se aplica <strong>en toda la aplicación</strong> (controles, formularios, tarjetas, modales y tablas)
                    y se almacena en tus preferencias locales.
                  </p>
                </div>
              </div>

              {/* Banner de Estado Global */}
              <div className={styles.fontGlobalBanner}>
                <div className={styles.fontGlobalBannerInfo}>
                  <Type className="size-5 text-[var(--accent-cyan)]" />
                  <div>
                    <strong>Tipografía Activa Globalmente: {currentFontDef.name}</strong>
                    <span> · {currentFontDef.tagline}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-sans font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Sincronizado en toda la app
                  </span>
                </div>
              </div>

              {/* Grid de Fuentes Candidatas */}
              <div className={styles.fontCandidateGrid}>
                {DESIGN_FONTS.map((fontId) => {
                  const fontDef = FONT_DEFINITIONS[fontId];
                  const isActive = currentFont === fontId;
                  return (
                    <div
                      key={fontId}
                      role="button"
                      tabIndex={0}
                      onClick={() => setPreferences({ font: fontId })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setPreferences({ font: fontId });
                        }
                      }}
                      className={`${styles.fontCandidateCard} ${isActive ? styles.isFontActive : ''}`}
                    >
                      <div className={styles.fontCandidateHeader}>
                        <strong>{fontDef.name}</strong>
                        <span className={styles.fontCandidateBadge}>{fontDef.badge}</span>
                      </div>

                      <div
                        className={styles.fontCandidateSpecimen}
                        style={{ fontFamily: fontDef.familyCss }}
                      >
                        TOURNAMENT PRO 2026
                      </div>

                      <p className={styles.fontCandidateDna}>{fontDef.dna}</p>

                      <div className={styles.fontCandidateBestFor}>
                        <Zap className="size-3 shrink-0" />
                        <span>{fontDef.bestFor}</span>
                      </div>

                      <div className={styles.fontCandidateAction}>
                        {isActive ? (
                          <>
                            <Check className="size-3.5" />
                            <span>Activa Globalmente</span>
                          </>
                        ) : (
                          <>
                            <MousePointer2 className="size-3.5" />
                            <span>Activar en Toda la App</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Título de la Escala Matemática */}
              <div className="mb-3 pt-3 border-t border-[var(--border-card)]">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  Escala Editorial Minor Third (1.200^n) renderizada en vivo con {currentFontDef.name}:
                </span>
              </div>

              <div className={styles.minorThirdList}>
                {MINOR_THIRD_SCALE.map((step) => (
                  <div key={step.name} className={styles.minorThirdRow}>
                    <span>{step.name}</span>
                    <code>{step.size}</code>
                    <strong style={{ fontSize: step.name === 'Display' ? '1.8rem' : step.name === 'H1' ? '1.5rem' : step.name === 'H2' ? '1.25rem' : '1rem' }}>
                      {step.sample}
                    </strong>
                    <small>{step.ratio} · {step.px}</small>
                  </div>
                ))}
              </div>
            </article>
          )}

          {/* TAB 3: RADIUS LADDER */}
          {foundationTab === 'radius' && (
            <article
              id="foundation-panel-radius"
              role="tabpanel"
              aria-labelledby="foundation-tab-radius"
              className={styles.foundationDisplayPanel}
            >
              <div className={styles.foundationDisplayHeader}>
                <div>
                  <small>PREDICTIVE RADIUS LADDER</small>
                  <h3>Escalera de Radios Predictiva: 12 → 24 px</h3>
                  <p>Menos excepciones visuales. Las esquinas redondeadas comunican función: controles interactivos a 12 px, tarjetas contenedoras a 16 px, modales a 24 px y badges semánticos en píldora.</p>
                </div>
              </div>

              <div className={styles.radiusLiveArena}>
                {RADIUS_LEVELS.map((r) => {
                  const IconComp = r.icon;
                  const isSelected = activeRadiusId === r.id;
                  const radiusStyle = r.id === 'control' ? '12px' : r.id === 'card' ? '16px' : r.id === 'hero' ? '24px' : '9999px';
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setActiveRadiusId(r.id)}
                      className={`${styles.radiusCardDemo} ${isSelected ? styles.isRadiusActive : ''}`}
                      style={{ borderRadius: radiusStyle }}
                    >
                      <div className={styles.radiusShape} style={{ borderRadius: radiusStyle }}>
                        <IconComp className="size-6" />
                      </div>
                      <strong>{r.name}</strong>
                      <small><code>{r.token}</code> ({r.px})</small>
                      <p>{r.use}</p>
                    </button>
                  );
                })}
              </div>
            </article>
          )}

          {/* TAB 4: SEMANTIC COLORS & DUAL THEMING ENGINE */}
          {foundationTab === 'color' && (
            <article
              id="foundation-panel-color"
              role="tabpanel"
              aria-labelledby="foundation-tab-color"
              className={styles.foundationDisplayPanel}
            >
              <div className={styles.foundationDisplayHeader}>
                <div>
                  <small>DUAL THEMING ENGINE · 9 COLORES OFICIALES</small>
                  <h3>Color Semántico: Sistema Base vs Disciplinas GameSlug</h3>
                  <p>
                    La plataforma opera con dos sistemas en perfecto equilibrio matemático:
                    <strong> 1. Páginas fuera de GameSlug</strong> (Lienzo oficial TournamentsPro #DC2011) y
                    <strong> 2. Páginas con GameSlug</strong> (donde cada disciplina adopta 9 colores exactos para mantener la misma jerarquía y contraste).
                  </p>
                </div>
              </div>

              {/* Selector de Contexto Visual */}
              <div className="mb-4 p-3 rounded-2xl bg-[color-mix(in_srgb,var(--bg-main)_70%,transparent)] border border-[var(--border-card)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Palette className="size-4 text-[var(--app-accent)]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-heading)] font-sans">
                    Simular Contexto Activo:
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewPaletteSlug('system')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border font-sans cursor-pointer ${
                      isSystemPreview
                        ? 'bg-[var(--app-accent)] text-[var(--accent-contrast)] border-[var(--app-accent)] shadow-md'
                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-card)] hover:border-[var(--border-card-hover)]'
                    }`}
                  >
                    🛡️ Sistema Base (Fuera de GameSlug)
                  </button>
                  {Object.values(GAMES_CATALOG).map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setPreviewPaletteSlug(g.slug as PreviewPaletteSlug)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border font-sans cursor-pointer ${
                        previewPaletteSlug === g.slug
                          ? 'border-white text-white shadow-md'
                          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-card)] hover:border-[var(--border-card-hover)]'
                      }`}
                      style={previewPaletteSlug === g.slug ? { backgroundColor: g.semanticPalette.brandPrimary } : {}}
                    >
                      {g.icon} {g.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner de Contexto Activo */}
              <div className="mb-4 px-4 py-2.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full animate-pulse" style={{ backgroundColor: activePreviewPalette.brandPrimary }} />
                  <strong className="text-[var(--text-heading)] font-sans">
                    {isSystemPreview ? 'TournamentsPro · Sistema Maestro Oficial' : `${GAMES_CATALOG[previewPaletteSlug]?.name} · Paleta de Disciplina`}
                  </strong>
                  <span className="text-[var(--text-muted)] font-sans">
                    {isSystemPreview ? '9 tokens semánticos globales sin contexto de juego' : `9 tokens equilibrados para páginas /${previewPaletteSlug}`}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--bg-main)] border border-[var(--border-card)] text-[var(--text-secondary)]">
                  Primary: {activePreviewPalette.brandPrimary}
                </span>
              </div>

              {/* Matriz de los 9 Colores del Contexto */}
              <div className={styles.colorMatrixGrid}>
                {dynamicColors.map((c) => (
                  <div
                    key={c.name}
                    className={styles.colorMatrixCard}
                    onClick={() => copyColor(c.value)}
                    role="button"
                    tabIndex={0}
                    style={{ '--color-val': c.value } as CSSProperties}
                  >
                    {copiedSwatch === c.value && (
                      <span className={styles.copiedBadge}><Check className="size-3" /> Copiado</span>
                    )}
                    <div className={styles.colorMatrixBlock} style={{ background: c.value }}>
                      <span>{c.contrast}</span>
                    </div>
                    <div className={styles.colorMatrixInfo}>
                      <strong>{c.name}</strong>
                      <code>{c.token} · {c.value}</code>
                      <small>{c.role}</small>
                    </div>
                  </div>
                ))}
              </div>

              {/* Matriz Comparativa de las 6 Disciplinas vs Sistema Base */}
              <div className="mt-6 pt-5 border-t border-[var(--border-card)] space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold uppercase tracking-wider text-[var(--text-heading)] font-sans">
                    Matriz Comparativa de Equilibrio: 9 Tokens × 7 Contextos
                  </strong>
                  <span className="text-[11px] text-[var(--text-muted)] font-sans">Misma respuesta semántica en toda la plataforma</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)]">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[var(--bg-main)] text-[var(--text-muted)] text-[10px] uppercase font-black border-b border-[var(--border-card)]">
                      <tr>
                        <th className="p-3">Rol Semántico</th>
                        <th className="p-3">Token CSS</th>
                        <th className="p-3">Sistema Base</th>
                        <th className="p-3">EA FC 26</th>
                        <th className="p-3">VALORANT</th>
                        <th className="p-3">CS2</th>
                        <th className="p-3">LoL</th>
                        <th className="p-3">Rocket League</th>
                        <th className="p-3">Fortnite</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-card)] font-medium text-[var(--text-primary)]">
                      {[
                        { role: 'Brand Primary', token: '--app-accent', sys: '#DC2011', fc: '#077D7E', val: '#FF4654', cs: '#DE9B35', lol: '#D39542', rl: '#00BBFF', fn: '#9D4DBB' },
                        { role: 'Brand Secondary', token: '--app-accent-2', sys: '#8F0B13', fc: '#055859', val: '#BA3A46', cs: '#A86E1B', lol: '#8C5A1E', rl: '#0060FF', fn: '#6A2E82' },
                        { role: 'Brand Deep', token: '--brand-900', sys: '#380F17', fc: '#032627', val: '#381419', cs: '#332107', lol: '#2B1905', rl: '#051A3B', fn: '#2D0F38' },
                        { role: 'Success / Confirm', token: '--accent-success', sys: '#5F8F72', fc: '#10B981', val: '#46C291', cs: '#4BB543', lol: '#3CD070', rl: '#22C55E', fn: '#319236' },
                        { role: 'Warning / Attention', token: '--accent-warning', sys: '#D9A441', fc: '#C35B0D', val: '#FFB84D', cs: '#DE9B35', lol: '#E0B354', rl: '#F59E0B', fn: '#F3AF19' },
                        { role: 'Danger / Penalty', token: '--accent-crimson', sys: '#DC2011', fc: '#DC2011', val: '#FF4654', cs: '#E24B4B', lol: '#E84057', rl: '#EF4444', fn: '#E11D48' },
                        { role: 'Canvas Base', token: '--bg-main', sys: '#111414', fc: '#0B1314', val: '#0F141C', cs: '#0E1115', lol: '#0B0C15', rl: '#0A0F17', fn: '#0E0B16' },
                        { role: 'Surface Elevated', token: '--bg-card', sys: '#252B2B', fc: '#162223', val: '#1A2230', cs: '#1A2027', lol: '#161726', rl: '#131F2E', fn: '#1A1526' },
                        { role: 'Steel Border', token: '--border-card', sys: '#4C4F54', fc: '#2D4244', val: '#354256', cs: '#364250', lol: '#343652', rl: '#2A3F5B', fn: '#3E3255' },
                      ].map((row) => (
                        <tr key={row.token} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                          <td className="p-3 font-bold text-[var(--text-heading)]">{row.role}</td>
                          <td className="p-3"><code>{row.token}</code></td>
                          <td className="p-3"><span className="inline-block size-3 rounded-sm mr-1.5 align-middle" style={{ background: row.sys }} />{row.sys}</td>
                          <td className="p-3"><span className="inline-block size-3 rounded-sm mr-1.5 align-middle" style={{ background: row.fc }} />{row.fc}</td>
                          <td className="p-3"><span className="inline-block size-3 rounded-sm mr-1.5 align-middle" style={{ background: row.val }} />{row.val}</td>
                          <td className="p-3"><span className="inline-block size-3 rounded-sm mr-1.5 align-middle" style={{ background: row.cs }} />{row.cs}</td>
                          <td className="p-3"><span className="inline-block size-3 rounded-sm mr-1.5 align-middle" style={{ background: row.lol }} />{row.lol}</td>
                          <td className="p-3"><span className="inline-block size-3 rounded-sm mr-1.5 align-middle" style={{ background: row.rl }} />{row.rl}</td>
                          <td className="p-3"><span className="inline-block size-3 rounded-sm mr-1.5 align-middle" style={{ background: row.fn }} />{row.fn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </article>
          )}
        </div>

        <CodeBlock title="tokens.json · Foundation Layer" code={TOKEN_SAMPLE} />
      </section>

      <ComponentLibraryLab />

      <section className={styles.section} id="motion">
        <SectionHeading number="03" eyebrow="Motion manifesto" title="Movimiento que explica" description="La interfaz no se mueve para decorar: revela causalidad, continuidad espacial y respuesta inmediata." />
        <div className={styles.motionGrid}>
          <article className={styles.motionDemo}>
            <header><div><small>INTERACTIVE TIMELINE</small><h3>Coreografía estándar</h3></div><button type="button" onClick={() => setMotionRun((run) => run + 1)}><Play />Reproducir</button></header>
            <div className={styles.motionTrack} key={motionRun}><span /><span /><span /><span /></div>
            <div className={styles.motionLabels}><span>Entrada</span><span>Contenido</span><span>Acción</span><span>Reposo</span></div>
          </article>
          <div className={styles.durationList}>{MOTION.map((item, index) => <article key={item.name}><span style={{ '--duration-width': `${28 + index * 14}%` } as CSSProperties} /><strong>{item.name}</strong><code>{item.duration}</code><small>{item.use}</small></article>)}</div>
        </div>
        <div className={styles.motionPrinciples}><article><MousePointer2 /><h3>Respuesta inmediata</h3><p>El estado visual inicia en menos de 100 ms tras la intención.</p></article><article><TimerReset /><h3>Continuidad</h3><p>Los elementos conservan origen, dirección y jerarquía durante el cambio.</p></article><article><Zap /><h3>Energía contenida</h3><p>Máximo una animación de énfasis simultánea por viewport.</p></article></div>
        <CodeBlock title="motion.css" code={MOTION_SAMPLE} />
      </section>

      <section className={styles.section} id="depth">
        <SectionHeading number="04" eyebrow="Spatial interface" title="Profundidad integrada" description="WebGL y 3D aparecen donde mejoran orientación, identidad o comprensión; el contenido y la acción nunca dependen de ellos." />
        <div className={styles.depthStage}>
          <div className={styles.depthCard}><div className={styles.depthLayers}><span>01</span><span>02</span><span>03</span></div><small>CSS 3D · HOVER / FOCUS</small><h3>Capas con jerarquía espacial</h3><p>La elevación en Z distingue fondo, contenido y acción manteniendo una lectura inmediata.</p><button type="button">Explorar profundidad <ChevronRight /></button></div>
          <div className={styles.useCases}><article><Box /><div><h3>Hero de identidad</h3><p>Objeto low-poly o insignia como ancla visual, cargado después del contenido crítico.</p></div></article><article><LoaderCircle /><div><h3>Loading contextual</h3><p>Geometría ligera que representa progreso real; nunca una espera indefinida.</p></div></article><article><Activity /><div><h3>Datos espaciales</h3><p>Solo cuando el eje Z expresa una dimensión que una gráfica 2D no comunica.</p></div></article><article><Layers3 /><div><h3>Transición de contexto</h3><p>Profundidad breve entre directorio y ficha para preservar continuidad.</p></div></article></div>
        </div>
        <div className={styles.performanceGrid}><article><strong>≤ 100 KB</strong><span>Geometría comprimida</span><small>Draco/Meshopt y texturas WebP/AVIF.</small></article><article><strong>≤ 100k</strong><span>Triángulos visibles</span><small>LOD por distancia y eliminación fuera de cámara.</small></article><article><strong>DPR 1–1.5</strong><span>Resolución adaptativa</span><small>Evita renderizar píxeles imperceptibles.</small></article><article><strong>30 / 60 FPS</strong><span>Calidad escalonada</span><small>Reducir efectos antes de perder interacción.</small></article></div>
        <CodeBlock title="scene.tsx · React Three Fiber" code={R3F_SAMPLE} />
      </section>

      <section className={styles.section} id="implementation">
        <SectionHeading number="05" eyebrow="Delivery model" title="Implementación sostenible" description="Una arquitectura por capas mantiene los tokens estables, los componentes predecibles y las experiencias especializadas bajo control." />
        <div className={styles.architecture}>
          <article><span>01</span><h3>Tokens</h3><p>Valores primitivos y semánticos versionados.</p></article><i /><article><span>02</span><h3>Primitivas</h3><p>Button, Field, Surface, Dialog y Status.</p></article><i /><article><span>03</span><h3>Patrones</h3><p>Header, filtros, tablas y flujos CRUD.</p></article><i /><article><span>04</span><h3>Experiencias</h3><p>GameSlug, dashboard y perfiles públicos.</p></article>
        </div>
        <div className={styles.guidelineGrid}><article><h3>Composición primero</h3><p>Extender por slots y variantes declarativas. Evitar duplicar componentes para diferencias puramente visuales.</p></article><article><h3>Rendimiento por defecto</h3><p>Server Components para contenido; cliente solo para interacción. Three.js y Framer Motion mediante importación dinámica.</p></article><article><h3>Accesibilidad estructural</h3><p>Semántica, teclado y lectura forman parte de la API del componente, no de una revisión posterior.</p></article></div>
      </section>

      <section className={styles.section} id="quality">
        <SectionHeading number="06" eyebrow="Definition of done" title="Control de calidad visual" description="La interfaz se considera terminada cuando supera criterios visuales, funcionales, accesibles y de rendimiento reproducibles." />
        <div className={styles.qaLayout}>
          <div className={styles.checklist}>{QA.map((item, index) => <button key={item} type="button" aria-pressed={checks[index]} onClick={() => toggleCheck(index)}><span>{checks[index] ? <Check /> : index + 1}</span><p>{item}</p></button>)}</div>
          <aside className={styles.scoreCard}><small>DESIGN QA SCORE</small><strong>{Math.round((completed / QA.length) * 100)}<span>%</span></strong><div><span style={{ width: `${(completed / QA.length) * 100}%` }} /></div><p>{completed} de {QA.length} criterios validados</p>{completed === QA.length ? <em><BadgeCheck />Listo para producción</em> : <em><CircleAlert />Validación en progreso</em>}</aside>
        </div>
      </section>

      <div className="flex items-center justify-between p-4 my-10 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)]/80 backdrop-blur-md text-xs text-[var(--text-secondary)] font-sans">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[var(--accent-cyan)]" />
          <span>TournamentsPro Design System 3.0 · Foundation Layer Estandarizada</span>
        </div>
        <a href="#top" className="text-[var(--accent-cyan)] font-bold hover:underline flex items-center gap-1">
          Volver arriba ↑
        </a>
      </div>

      {modalOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="premium-modal-title">
            <header>
              <div><span><Sparkles />ESPECIFICACIÓN 3.0</span><h2 id="premium-modal-title">Modal con Jerarquía Matemática</h2></div>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Cerrar"><X /></button>
            </header>
            <p>Radio de 24 px (`--radius-hero`), ritmo de espaciado de 8 px en padding interno y tipografía unificada Outfit. En móvil conserva desplazamiento y botones fijos.</p>
            <div className={styles.modalInsight}>
              <ShieldCheck />
              <div>
                <strong>Acción reversible & WCAG AAA</strong>
                <small>Conserva consistencia semántica en claro, oscuro y OLED.</small>
              </div>
            </div>
            <footer>
              <button type="button" className={styles.secondary} onClick={() => setModalOpen(false)}>Cancelar</button>
              <button type="button" className={styles.primary} onClick={() => setModalOpen(false)}>Confirmar <Check /></button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}
