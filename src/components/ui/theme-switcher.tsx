'use client';

import type { ComponentType, CSSProperties } from 'react';
import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const subscribeToHydration = () => () => {};

interface ThemeOption {
  id: 'light' | 'dark' | 'oled';
  label: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'light', label: 'Claro', title: 'Blanco técnico y rojo competitivo', icon: Sun, accent: 'var(--app-accent-2)' },
  { id: 'dark', label: 'Oscuro', title: 'Carbón, borgoña y rojo activo', icon: Moon, accent: 'var(--app-accent)' },
  { id: 'oled', label: 'OLED', title: 'Negro puro y rojo eléctrico', icon: Zap, accent: 'var(--app-accent)' },
];

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  if (!mounted) {
    return <div className="h-10 w-[13rem] animate-pulse rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)]" />;
  }

  const changeTheme = (newTheme: ThemeOption['id']) => {
    if (newTheme === theme) return;
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }
    document.startViewTransition(() => setTheme(newTheme));
  };

  return (
    <div className={cn('theme-switcher-v2', className)} role="group" aria-label="Tema visual">
      {THEME_OPTIONS.map(({ id, label, title, icon: Icon, accent }) => {
        const active = theme === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => changeTheme(id)}
            title={title}
            aria-label={title}
            aria-pressed={active}
            className={cn('theme-switcher-option', active && 'is-active')}
            style={{ '--theme-option-accent': accent } as CSSProperties}
          >
            <Icon className="size-3.5" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
