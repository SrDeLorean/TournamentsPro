'use client';

import React from 'react';

export interface SubSubTabOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface SubSubNavbarProps<T extends string = string> {
  tabs: SubSubTabOption<T>[];
  activeTab: T;
  onSelectTab: (tabId: T) => void;
  brandColor?: string;
  className?: string;
}

export function SubSubNavbar<T extends string = string>({
  tabs,
  activeTab,
  onSelectTab,
  brandColor = '#00F0FF',
  className = '',
}: SubSubNavbarProps<T>) {
  return (
    <div className={`w-full bg-slate-950/90 border-t border-b border-slate-800/80 backdrop-blur-md relative z-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-1.5 touch-pan-x">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold w-full">
          {tabs.map((t) => {
            const isActive = t.id === activeTab;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap border flex-shrink-0 text-xs font-extrabold uppercase tracking-wider ${
                  isActive
                    ? 'shadow-md scale-102 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border-transparent'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: `color-mix(in srgb, ${brandColor} 20%, #0F172A)`,
                        borderColor: brandColor,
                        color: brandColor,
                        boxShadow: `0 4px 15px color-mix(in srgb, ${brandColor} 25%, transparent)`,
                      }
                    : {}
                }
              >
                {t.icon && <span className="flex-shrink-0">{t.icon}</span>}
                <span>{t.label}</span>
                {t.badge !== undefined && (
                  <span
                    className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold border"
                    style={
                      isActive
                        ? { backgroundColor: brandColor, color: '#000000', borderColor: brandColor }
                        : { backgroundColor: '#1E293B', color: '#94A3B8', borderColor: '#334155' }
                    }
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
