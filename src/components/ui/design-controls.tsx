'use client';

import { RotateCcw } from 'lucide-react';
import { useDesign } from '@/components/providers/design-provider';
import { Button } from '@/components/ui/button';
import type { DesignDensity, DesignMotion, DesignRadius } from '@/lib/design-system';

const ACCENTS = ['#22d3ee', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#ff4655'];

interface ChoiceProps<T extends string> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

function Choice<T extends string>({ label, value, options, onChange }: ChoiceProps<T>) {
  return (
    <label className="space-y-2 text-xs font-semibold text-[var(--text-secondary)]">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="input-theme h-10 w-full rounded-[var(--ui-radius-control)] px-3"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export function DesignControls() {
  const { preferences, setPreferences, resetPreferences } = useDesign();

  return (
    <section className="glass-panel rounded-[var(--ui-radius-card)] p-5 sm:p-6 space-y-6" aria-labelledby="global-design-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id="global-design-title" className="text-lg font-bold">Editor visual global</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Los cambios se guardan y afectan todas las páginas de la aplicación.</p>
        </div>
        <Button variant="outline" size="sm" onClick={resetPreferences}>
          <RotateCcw className="h-4 w-4" /> Restaurar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Choice<DesignDensity>
          label="Densidad"
          value={preferences.density}
          onChange={(density) => setPreferences({ density })}
          options={[{ value: 'compact', label: 'Compacta' }, { value: 'comfortable', label: 'Cómoda' }, { value: 'spacious', label: 'Amplia' }]}
        />
        <Choice<DesignRadius>
          label="Forma"
          value={preferences.radius}
          onChange={(radius) => setPreferences({ radius })}
          options={[{ value: 'sharp', label: 'Recta' }, { value: 'soft', label: 'Suave' }, { value: 'rounded', label: 'Redondeada' }]}
        />
        <Choice<DesignMotion>
          label="Movimiento"
          value={preferences.motion}
          onChange={(motion) => setPreferences({ motion })}
          options={[{ value: 'reduced', label: 'Reducido' }, { value: 'standard', label: 'Estándar' }, { value: 'expressive', label: 'Expresivo' }]}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Range label="Escala" value={preferences.scale} min={90} max={110} suffix="%" onChange={(scale) => setPreferences({ scale })} />
        <Range label="Opacidad de superficie" value={preferences.surfaceOpacity} min={55} max={100} suffix="%" onChange={(surfaceOpacity) => setPreferences({ surfaceOpacity })} />
        <Range label="Desenfoque" value={preferences.blur} min={0} max={30} suffix="px" onChange={(blur) => setPreferences({ blur })} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold text-[var(--text-secondary)]">Color global de interacción</legend>
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((accentColor) => (
            <button
              key={accentColor}
              type="button"
              aria-label={`Usar color ${accentColor}`}
              aria-pressed={preferences.accentColor === accentColor}
              onClick={() => setPreferences({ accentColor })}
              className="h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 aria-pressed:scale-110 aria-pressed:border-white"
              style={{ backgroundColor: accentColor, borderColor: preferences.accentColor === accentColor ? 'white' : 'transparent' }}
            />
          ))}
          <input
            type="color"
            aria-label="Color personalizado"
            value={preferences.accentColor}
            onChange={(event) => setPreferences({ accentColor: event.target.value })}
            className="h-10 w-12 cursor-pointer rounded-lg border border-[var(--border-card)] bg-transparent p-1"
          />
        </div>
      </fieldset>
    </section>
  );
}

function Range({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (value: number) => void }) {
  return (
    <label className="space-y-2 text-xs font-semibold text-[var(--text-secondary)]">
      <span className="flex justify-between"><span>{label}</span><output>{value}{suffix}</output></span>
      <input className="w-full accent-[var(--accent-cyan)]" type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
