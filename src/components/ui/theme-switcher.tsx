'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { Sun, Moon, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const subscribeToHydration = () => () => {};

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  if (!mounted) {
    return <div className="w-[180px] h-9 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] animate-pulse" />;
  }

  const handleThemeChange = (newTheme: string) => {
    if (newTheme === theme) return;
    
    // Fallback if View Transitions API is not supported
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    // Ultra-smooth native crossfade for theme switching (Linear/Vercel aesthetic)
    document.startViewTransition(() => {
      // flushSync isn't strictly necessary with next-themes, but it ensures the DOM updates instantly inside the transition
      setTheme(newTheme);
    });
  };

  return (
    <div className={cn("inline-flex items-center p-1 rounded-xl bg-[var(--bg-card)]/60 border border-[var(--border-card)] backdrop-blur-xl shadow-sm transition-all duration-300", className)}>
      <button
        onClick={() => handleThemeChange('light')}
        title="Modo Claro"
        className={cn(
          "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 flex items-center gap-1.5 relative",
          theme === 'light'
            ? "text-amber-600 bg-white shadow-sm border border-black/5"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
        )}
      >
        <Sun className="w-3.5 h-3.5 text-amber-500" />
        <span className="hidden sm:inline">Claro</span>
      </button>

      <button
        onClick={() => handleThemeChange('dark')}
        title="Modo Oscuro"
        className={cn(
          "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 flex items-center gap-1.5 relative",
          theme === 'dark'
            ? "text-white bg-slate-800 shadow-sm border border-white/10"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
        )}
      >
        <Moon className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">Oscuro</span>
      </button>

      <button
        onClick={() => handleThemeChange('oled')}
        title="Modo OLED (Pitch Black)"
        className={cn(
          "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 flex items-center gap-1.5 relative",
          theme === 'oled'
            ? "text-purple-300 bg-black shadow-sm border border-purple-500/30"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
        )}
      >
        <Zap className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20" />
        <span className="hidden sm:inline">OLED</span>
      </button>
    </div>
  );
}
