'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-24 h-9 rounded-lg bg-[var(--bg-card-hover)] animate-pulse" />;
  }

  return (
    <div className={cn("inline-flex items-center p-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] backdrop-blur-md shadow-sm", className)}>
      <button
        onClick={() => setTheme('light')}
        title="Modo Claro"
        className={cn(
          "px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5",
          theme === 'light'
            ? "bg-amber-500/10 text-amber-700 border border-amber-500/30 shadow-sm"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        )}
      >
        <Sun className="w-3.5 h-3.5 text-amber-500" />
        <span className="hidden sm:inline">Claro</span>
      </button>

      <button
        onClick={() => setTheme('dark')}
        title="Modo Oscuro"
        className={cn(
          "px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5",
          theme === 'dark'
            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        )}
      >
        <Moon className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">Oscuro</span>
      </button>

      <button
        onClick={() => setTheme('oled')}
        title="Modo OLED (Pitch Black)"
        className={cn(
          "px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5",
          theme === 'oled'
            ? "bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-sm"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        )}
      >
        <Zap className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20" />
        <span className="hidden sm:inline">OLED</span>
      </button>
    </div>
  );
}
