import { Box, Layers3, MousePointer2, ShieldCheck } from 'lucide-react';

export const SPACING_STEPS = [
  { step: '1', px: 4, rem: '0.25rem', token: '--space-1', name: 'Micro (4px)', use: 'Icon gaps, padding de badges' },
  { step: '2', px: 8, rem: '0.50rem', token: '--space-2', name: 'Compact (8px)', use: 'Gaps entre botones inline y tags' },
  { step: '3', px: 12, rem: '0.75rem', token: '--space-3', name: 'Base (12px)', use: 'Padding vertical de inputs y controles' },
  { step: '4', px: 16, rem: '1.00rem', token: '--space-4', name: 'Standard (16px)', use: 'Padding horizontal de botones, padding de tarjeta móvil' },
  { step: '5', px: 20, rem: '1.25rem', token: '--space-5', name: 'Medium (20px)', use: 'Iconos XL y separaciones de grupo' },
  { step: '6', px: 24, rem: '1.50rem', token: '--space-6', name: 'Section (24px)', use: 'Padding desktop de tarjetas y gap de columnas' },
  { step: '8', px: 32, rem: '2.00rem', token: '--space-8', name: 'Large (32px)', use: 'Altura de controles sm y separación de métricas' },
  { step: '10', px: 40, rem: '2.50rem', token: '--space-10', name: 'Control MD (40px)', use: 'Altura estándar de Button md, Input, Select' },
  { step: '12', px: 48, rem: '3.00rem', token: '--space-12', name: 'Control LG (48px)', use: 'Altura de Button lg y cabeceras tácticas' },
  { step: '16', px: 64, rem: '4.00rem', token: '--space-16', name: 'Structural (64px)', use: 'Ritmo vertical entre secciones maestras' },
] as const;

export const MINOR_THIRD_SCALE = [
  { name: 'Display', ratio: '1.200^5', size: 'clamp(2.5rem, 6vw, 4.5rem)', px: '40 → 72 px', sample: 'Torneos eSports' },
  { name: 'H1', ratio: '1.200^4', size: 'clamp(2rem, 4vw, 3rem)', px: '32 → 48 px', sample: 'Clasificación Oficial' },
  { name: 'H2', ratio: '1.200^3', size: '1.728rem', px: '27.6 px', sample: 'Partidos de la Jornada' },
  { name: 'H3', ratio: '1.200^2', size: '1.440rem', px: '23.0 px', sample: 'Estadísticas Avanzadas' },
  { name: 'H4 / Lead', ratio: '1.200^1', size: '1.200rem', px: '19.2 px', sample: 'Fase Regular & Playoffs 2026' },
  { name: 'Body (Base)', ratio: '1.200^0', size: '1.000rem', px: '16.0 px', sample: 'Cada decisión visual parte de una escala matemática predecible.' },
  { name: 'Small', ratio: '1.200^-1', size: '0.8125rem', px: '13.0 px', sample: 'Tiempo añadido: 3 minutos · Servidor Frankfurt 01' },
  { name: 'Micro', ratio: '1.200^-2', size: '0.6875rem', px: '11.0 px', sample: 'WCAG AAA · 60 FPS · CERO RUNTIME 3D' },
] as const;

export const RADIUS_LEVELS = [
  { id: 'control', px: '12 px', token: '--radius-control', name: 'Controles Tácticos', use: 'Button, Input, Select, Checkbox, SearchBar', icon: MousePointer2 },
  { id: 'card', px: '16 px', token: '--radius-card', name: 'Superficies & Tarjetas', use: 'Card, Panels, Dropdown menus, DataTables', icon: Box },
  { id: 'hero', px: '24 px', token: '--radius-hero', name: 'Escenarios & Modales', use: 'Modal dialogs, Hero sections, Stage 3D containers', icon: Layers3 },
  { id: 'pill', px: '9999 px', token: '--radius-pill', name: 'Píldoras & Estado', use: 'Badges semánticos, Chips de disciplina, Avatares', icon: ShieldCheck },
] as const;

export const MOTION = [
  { name: 'Instant', duration: '80 ms', use: 'Press, toggle, selección' },
  { name: 'Fast', duration: '160 ms', use: 'Hover, focus, tooltip' },
  { name: 'Standard', duration: '240 ms', use: 'Menús y paneles' },
  { name: 'Emphasis', duration: '360 ms', use: 'Modal y cambio de contexto' },
  { name: 'Scene', duration: '600 ms', use: 'Entrada hero y navegación' },
] as const;

export const QA = [
  'Tipografía uniforme Outfit en el 100% de controles, textos, modales y tablas.',
  'Contraste mínimo AAA en texto principal y controles críticos de acción.',
  'Grid de espaciado matemático: múltiplos de 4 en controles y 8 en estructuras.',
  'Escalera de radios estricta: 12 px controles, 16 px tarjetas, 24 px modales y píldoras.',
  'Foco visible, orden lógico de teclado y objetivo táctil mínimo de 40 px.',
  'Sin desplazamiento horizontal a 320, 390, 768, 1024 y 1440 px.',
  'Las animaciones respetan prefers-reduced-motion y no bloquean acciones.',
  'Tokens semánticos sustituyen colores y duraciones aisladas en toda la suite.',
] as const;

export const TOKEN_SAMPLE = `{
  "typography": { "fontFamily": "Outfit, ui-sans-serif, system-ui, sans-serif", "scaleRatio": 1.200 },
  "spacingGrid": { "base": "4px / 8px", "1": "4px", "2": "8px", "4": "16px", "10": "40px", "16": "64px" },
  "radiusLadder": { "control": "12px", "card": "16px", "hero": "24px", "pill": "9999px" },
  "semanticColor": {
    "brand": { "primary": "#DC2011", "secondary": "#8F0B13", "deep": "#380F17" },
    "surface": { "canvas": "#111414", "card": "#252B2B", "elevated": "#303536" },
    "status": { "success": "#5F8F72", "warning": "#D9A441", "danger": "#DC2011", "info": "#8493A5" }
  }
}`;

export const MOTION_SAMPLE = `.interactive {
  transition: transform var(--motion-fast) cubic-bezier(.16, 1, .3, 1), box-shadow var(--motion-standard) cubic-bezier(.22, 1, .36, 1);
}
.interactive:hover { transform: translateY(-2px) translateZ(12px); }
.interactive:active { transform: translateY(0) scale(.98); }
@media (prefers-reduced-motion: reduce) { .interactive { transition-duration: 1ms; transform: none; } }`;

export const R3F_SAMPLE = `const Scene = dynamic(() => import('./scene'), { ssr: false });

<Canvas dpr={[1, 1.5]} frameloop={reduced ? 'demand' : 'always'}>
  <ambientLight intensity={1.2} />
  <mesh>
    <icosahedronGeometry args={[1, 2]} />
    <meshStandardMaterial color="var(--brand-500)" metalness={0.7} />
  </mesh>
</Canvas>`;
