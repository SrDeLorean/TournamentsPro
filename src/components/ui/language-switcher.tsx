'use client';

import { useTranslation, Language } from '@/components/providers/language-provider';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useTranslation();

  const options: { code: Language; label: string; flag: string }[] = [
    { code: 'es', label: 'ES', flag: '🇪🇸' },
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'pt', label: 'PT', flag: '🇧🇷' },
  ];

  return (
    <div className={cn("inline-flex items-center p-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-card)] backdrop-blur-md shadow-sm", className)}>
      <Globe className="w-3.5 h-3.5 ml-1.5 text-[var(--text-muted)]" />
      <div className="flex items-center gap-1 ml-1.5">
        {options.map((opt) => (
          <button
            key={opt.code}
            onClick={() => setLanguage(opt.code)}
            className={cn(
              "px-2 py-0.5 rounded text-xs font-bold transition-all",
              language === opt.code
                ? "bg-[var(--app-accent-soft)] text-[var(--app-accent)] border border-[var(--app-accent)]/30 shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            <span className="mr-1">{opt.flag}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
