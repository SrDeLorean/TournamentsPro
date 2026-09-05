'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, ArrowRightLeft, Calendar, Trophy, ChevronRight, Inbox } from 'lucide-react';
import Link from 'next/link';

export interface NotificationItem {
  id: string;
  type: 'TRANSFER' | 'MATCH' | 'TOURNAMENT' | 'SYSTEM';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

type NotificationFilter = 'ALL' | Exclude<NotificationItem['type'], 'SYSTEM'>;

export function NotificationCenter({ onOpen }: { onOpen?: () => void } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('ALL');
  const popoverRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'TRANSFER',
      title: 'Oferta de Contrato Recibida',
      description: 'El club SAN LORENZO ESP te ha enviado una oferta de fichaje para EA FC 26.',
      timestamp: 'Hace 5 min',
      isRead: false,
      actionUrl: '/eafc26/traspasos',
    },
    {
      id: 'notif-2',
      type: 'MATCH',
      title: 'Partido Convocado Hoy',
      description: 'Tu encuentro contra SANGRE NUEVA FC está programado para las 21:00 HS.',
      timestamp: 'Hace 1 hora',
      isRead: false,
      actionUrl: '/eafc26/partidos',
    },
    {
      id: 'notif-3',
      type: 'TOURNAMENT',
      title: 'Inscripción Confirmada',
      description: 'Tu escuadra ha sido aceptada oficialmente en la Liga Élite Pro 2026.',
      timestamp: 'Hace 3 horas',
      isRead: false,
      actionUrl: '/eafc26/competencias',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const togglePopover = () => {
    if (!isOpen) onOpen?.();
    setIsOpen((open) => !open);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications = activeFilter === 'ALL'
    ? notifications
    : notifications.filter((n) => n.type === activeFilter);

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={togglePopover}
        className="notification-center-trigger"
        aria-label={`Notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ''}`}
        aria-expanded={isOpen}
        aria-controls="notification-center-panel"
        title="Centro de Alertas & Notificaciones"
      >
        <Bell className="w-4 h-4 text-[var(--app-accent)]" />
        {unreadCount > 0 && (
          <span className="notification-center-count">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div id="notification-center-panel" className="notification-center-panel fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:w-[25rem] max-h-[85vh] overflow-y-auto z-50 p-3 sm:p-4 space-y-3 animate-in fade-in zoom-in-95">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--app-accent-soft)] border border-[var(--app-accent)]/40 text-[var(--app-accent)]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase text-[var(--text-heading)] tracking-wider leading-none">Notificaciones</h4>
                <span className="text-[9px] font-[family-name:var(--font-active)] text-[var(--text-muted)] font-bold">{unreadCount ? `${unreadCount} pendientes` : 'Todo al día'}</span>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-[var(--app-accent)] hover:text-[var(--text-heading)] font-extrabold flex items-center gap-1 bg-[var(--app-accent-soft)] px-2 py-1.5 rounded-lg border border-[var(--app-accent)]/30"
              >
                <Check className="w-3 h-3" />
                Marcar leídas
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-[10px] font-bold overflow-x-auto scrollbar-none pb-1">
            {([
              { id: 'ALL', label: 'Todas' },
              { id: 'TRANSFER', label: '🔄 Fichajes' },
              { id: 'MATCH', label: '📅 Partidos' },
              { id: 'TOURNAMENT', label: '🏆 Torneos' },
            ] satisfies Array<{ id: NotificationFilter; label: string }>).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                aria-pressed={activeFilter === tab.id}
                className={`px-2.5 py-1 rounded-lg transition-all flex-shrink-0 border ${
                  activeFilter === tab.id
                    ? 'bg-[var(--app-accent)] text-[var(--bg-main)] font-black border-[var(--app-accent)] shadow-sm'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-card)] hover:text-[var(--text-heading)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-center-item p-3 rounded-xl border transition-all text-xs space-y-1 relative group ${
                    !n.isRead
                      ? 'is-unread border-[var(--app-accent)]/40'
                      : 'border-[var(--border-card)] opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-extrabold text-[var(--text-heading)] text-[11px]">
                      {n.type === 'TRANSFER' && <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--app-warning)]" />}
                      {n.type === 'MATCH' && <Calendar className="w-3.5 h-3.5 text-[var(--app-positive)]" />}
                      {n.type === 'TOURNAMENT' && <Trophy className="w-3.5 h-3.5 text-[var(--app-accent)]" />}
                      <span>{n.title}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-[family-name:var(--font-active)] text-[var(--text-muted)]">{n.timestamp}</span>
                      <button
                        type="button"
                        onClick={() => removeNotification(n.id)}
                        aria-label={`Eliminar notificación: ${n.title}`}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--app-danger)] opacity-60 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
                    {n.description}
                  </p>

                  {n.actionUrl && (
                    <Link
                      href={n.actionUrl}
                      onClick={() => setIsOpen(false)}
                      className="text-[10px] text-[var(--app-accent)] font-black hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <span>Ir a la Sección</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)] space-y-2">
                <Inbox className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs font-bold">Sin alertas en esta categoría</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
