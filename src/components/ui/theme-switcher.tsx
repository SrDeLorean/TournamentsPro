'use client';

import type { ComponentType, CSSProperties } from 'react';
import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Gem, Moon, Orbit, Sun, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const subscribeToHydration = () => () => {};

interface ThemeOption {
  id: 'light' | 'dark' | 'oled' | 'arena' | 'prism';
  label: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'light', label: 'Claro', title: 'Tema claro editorial', icon: Sun, accent: '#f59e0b' },
  { id: 'dark', label: 'Noche', title: 'Tema oscuro equilibrado', icon: Moon, accent: '#22d3ee' },
  { id: 'oled', label: 'OLED', title: 'Negro puro para pantallas OLED', icon: Zap, accent: '#c084fc' },
  { id: 'arena', label: 'Arena', title: 'Arena inmersiva azul y cobre', icon: Orbit, accent: '#42e8ff' },
  { id: 'prism', label: 'Prisma', title: 'Cristal violeta con luz espectral', icon: Gem, accent: '#ff6bd6' },
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

