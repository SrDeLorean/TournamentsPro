'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Check, Trash2, ArrowRightLeft, Calendar, Trophy, ChevronRight, Inbox, Loader2 } from 'lucide-react';
import Link from 'next/link';

export interface NotificationItem {
  id: string;
  type: 'TRANSFER' | 'MATCH' | 'TOURNAMENT' | 'SYSTEM';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string | null;
  createdAt?: string;
}

type NotificationFilter = 'ALL' | Exclude<NotificationItem['type'], 'SYSTEM'>;

interface NotificationApiRecord {
  id: string;
  type?: NotificationItem['type'];
  title: string;
  description: string;
  isRead?: boolean;
  is_read?: boolean;
  actionUrl?: string | null;
  action_url?: string | null;
  createdAt?: string;
  created_at?: string;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Reciente';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Reciente';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} d`;
  } catch {
    return 'Reciente';
  }
}

export function NotificationCenter({ onOpen }: { onOpen?: () => void } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('ALL');
  const popoverRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json() as { success?: boolean; notifications?: NotificationApiRecord[] };
        if (data.success && Array.isArray(data.notifications)) {
          const items: NotificationItem[] = data.notifications.map((n) => ({
            id: n.id,
            type: n.type || 'SYSTEM',
            title: n.title,
            description: n.description,
            timestamp: formatRelativeTime(n.createdAt || n.created_at),
            isRead: Boolean(n.isRead ?? n.is_read),
            actionUrl: n.actionUrl || n.action_url,
            createdAt: n.createdAt || n.created_at,
          }));
          setNotifications(items);
          setUnreadCount(items.filter((item) => !item.isRead).length);
        }
      }
    } catch (err) {
      console.warn('No se pudieron cargar las notificaciones desde la API:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialRequest = window.setTimeout(() => void fetchNotifications(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void fetchNotifications();
    }, 60_000);
    return () => {
      window.clearTimeout(initialRequest);
      window.clearInterval(interval);
    };
  }, [fetchNotifications]);

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
    if (!isOpen) {
      onOpen?.();
      fetchNotifications();
    }
    setIsOpen((open) => !open);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (err) {
      console.warn('Error al marcar notificaciones leídas:', err);
    }
  };

  const markSingleAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.warn('Error al marcar notificación:', err);
    }
  };

  const removeNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => {
      const removed = notifications.find((n) => n.id === id);
      return removed && !removed.isRead ? Math.max(0, prev - 1) : prev;
    });
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Error al eliminar notificación:', err);
    }
  };

  const filteredNotifications = activeFilter === 'ALL'
    ? notifications
    : notifications.filter((n) => n.type === activeFilter);

  return (
    <div className="relative font-[family-name:var(--font-active)] text-xs" ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={togglePopover}
        className="notification-center-trigger relative"
        aria-label={`Notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ''}`}
        aria-expanded={isOpen}
        aria-controls="notification-center-panel"
        title="Centro de Alertas & Notificaciones"
      >
        <Bell className="w-4 h-4 text-[var(--app-accent)]" />
        {unreadCount > 0 && (
          <span className="notification-center-count animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div id="notification-center-panel" className="notification-center-panel fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:w-[25rem] max-h-[85vh] overflow-y-auto z-50 p-3 sm:p-4 space-y-3 animate-in fade-in zoom-in-95 shadow-2xl">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--app-accent-soft)] border border-[var(--app-accent)]/40 text-[var(--app-accent)]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase text-[var(--text-heading)] tracking-wider leading-none">Notificaciones</h4>
                <span className="text-[9px] text-[var(--text-muted)] font-bold">
                  {isLoading ? 'Actualizando...' : unreadCount ? `${unreadCount} pendientes` : 'Todo al día'}
                </span>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[10px] text-[var(--app-accent)] hover:text-[var(--text-heading)] font-extrabold flex items-center gap-1 bg-[var(--app-accent-soft)] px-2 py-1.5 rounded-lg border border-[var(--app-accent)]/30 transition-colors"
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
            {isLoading && notifications.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--app-accent)]" />
                <span className="text-[11px] font-bold">Cargando alertas...</span>
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-center-item p-3 rounded-xl border transition-all text-xs space-y-1 relative group ${
                    !n.isRead
                      ? 'is-unread border-[var(--app-accent)]/40 bg-[var(--app-accent-soft)]/20'
                      : 'border-[var(--border-card)] opacity-80'
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
                      <span className="text-[9px] text-[var(--text-muted)]">{n.timestamp}</span>
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
                      onClick={() => {
                        if (!n.isRead) markSingleAsRead(n.id);
                        setIsOpen(false);
                      }}
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
