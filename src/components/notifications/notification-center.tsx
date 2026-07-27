'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, ArrowRightLeft, Calendar, Trophy, Sparkles, X, Shield, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TRANSFER' | 'MATCH' | 'TOURNAMENT'>('ALL');
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-cyan-400/50 transition-all relative shadow-sm hover:scale-105"
        title="Centro de Alertas & Notificaciones"
      >
        <Bell className="w-4 h-4 text-cyan-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="fixed inset-x-2 top-14 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:w-96 max-h-[85vh] overflow-y-auto bg-slate-950/95 border border-cyan-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 p-4 space-y-3 backdrop-blur-xl animate-in fade-in zoom-in-95">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase text-white tracking-wider leading-none">Centro de Alertas</h4>
                <span className="text-[9px] font-mono text-cyan-400 font-bold">Competencias & Mercado</span>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-extrabold flex items-center gap-1 bg-cyan-950/80 px-2 py-1 rounded-lg border border-cyan-500/30"
              >
                <Check className="w-3 h-3" />
                Marcar leídas
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-[10px] font-bold overflow-x-auto scrollbar-none pb-1">
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'TRANSFER', label: '🔄 Fichajes' },
              { id: 'MATCH', label: '📅 Partidos' },
              { id: 'TOURNAMENT', label: '🏆 Torneos' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg transition-all flex-shrink-0 border ${
                  activeFilter === tab.id
                    ? 'bg-cyan-500 text-slate-950 font-black border-cyan-400 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
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
                  className={`p-3 rounded-xl border transition-all text-xs space-y-1 relative group ${
                    !n.isRead
                      ? 'bg-slate-900 border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.05)]'
                      : 'bg-slate-950/50 border-white/5 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-extrabold text-white text-[11px]">
                      {n.type === 'TRANSFER' && <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />}
                      {n.type === 'MATCH' && <Calendar className="w-3.5 h-3.5 text-emerald-400" />}
                      {n.type === 'TOURNAMENT' && <Trophy className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{n.title}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono text-slate-400">{n.timestamp}</span>
                      <button
                        onClick={() => removeNotification(n.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                    {n.description}
                  </p>

                  {n.actionUrl && (
                    <Link
                      href={n.actionUrl}
                      onClick={() => setIsOpen(false)}
                      className="text-[10px] text-cyan-400 font-black hover:underline inline-flex items-center gap-1 pt-1"
                    >
                      <span>Ir a la Sección</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 space-y-1">
                <Bell className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
                <p className="text-xs font-bold">Sin alertas en esta categoría</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
