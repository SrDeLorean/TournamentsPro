'use client';

import React, { useLayoutEffect, useRef } from 'react';
import { TabList } from '@/components/ui/tab-list';

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
  brandColor = 'var(--app-accent)',
  className = '',
}: SubSubNavbarProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navStyle = { '--subtab-brand': brandColor } as React.CSSProperties;

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const container = scrollRef.current;
      const activeTabElement = container?.querySelector<HTMLElement>('[data-active="true"]');
      if (!container || !activeTabElement || container.clientWidth === 0) return;

      const centeredLeft = activeTabElement.offsetLeft - (container.clientWidth - activeTabElement.offsetWidth) / 2;
      container.scrollTo({ left: Math.max(0, centeredLeft), behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab]);

  return (
    <nav className={`ui-sub-tabs ui-navigation-tier ${className}`} style={navStyle} aria-label="Secciones del perfil">
      <div ref={scrollRef} className="ui-sub-tabs-scroll">
        <TabList label="Secciones del perfil" className="ui-sub-tabs-track">
          {tabs.map((t) => {
            const isActive = t.id === activeTab;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                onClick={() => onSelectTab(t.id)}
                data-active={isActive}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                className={`ui-sub-tab${isActive ? ' is-active' : ''}`}
              >
                {t.icon && <span aria-hidden="true">{t.icon}</span>}
                <span>{t.label}</span>
                {t.badge !== undefined && (
                  <span className="ui-sub-tab-badge">{t.badge}</span>
                )}
              </button>
            );
          })}
        </TabList>
      </div>
    </nav>
  );
}
