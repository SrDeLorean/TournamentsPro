'use client';

import React, { useState } from 'react';
import { Shield, MessageSquare, Ban, CheckCircle2, UserX, AlertTriangle, Users, Search, RefreshCw, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChatSystem } from '@/components/chat/chat-system';

export function ModerationDashboard() {
  const [activeTab, setActiveTab] = useState<'chat' | 'bans'>('bans');
  
  // Dummy data for banned users
  const bannedUsers = [
    { id: 1, name: 'TrollGamer99', gamertag: 'xXTrollXx', reason: 'Lenguaje Inapropiado', date: '2023-10-25', status: 'banned', game: 'EA FC 26' },
    { id: 2, name: 'RageQuitter', gamertag: 'RageQuitPro', reason: 'Abandono frecuente', date: '2023-10-22', status: 'suspended', game: 'NBA 2K25' },
    { id: 3, name: 'ToxicPlayer', gamertag: 'Toxic123', reason: 'Acoso a otros jugadores', date: '2023-10-20', status: 'banned', game: 'Valorant' },
  ];

  // Dummy data for chat channels
  const chatChannels = [
    { id: 'general', name: 'Chat General Global', active: 1245 },
    { id: 'admin', name: 'Soporte y Reclamos', active: 42 },
    { id: 'eafc26', name: 'EA FC 26 Hub', active: 890 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="gold" className="text-[10px] font-black uppercase">
              Centro de Seguridad
            </Badge>
            <Badge variant="cyan" className="text-[10px] font-black uppercase">
              Global Admin
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Shield className="w-8 h-8 text-orange-500" />
            Moderación & Chat
          </h1>
          <p className="text-slate-400 font-mono text-sm mt-1 max-w-2xl">
            Panel central para la gestión de comportamiento, desbaneos de cuentas y monitoreo de chats globales.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Reportes Pendientes (12)
          </Button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-[var(--border-card)] mb-6 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('bans')}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'bans'
              ? 'border-orange-500 text-orange-400 bg-orange-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Ban className="w-4 h-4" />
          Cuentas y Bans
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'chat'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Monitor de Chat Global
        </button>
      </div>

      {/* CONTENT: BANS */}
      {activeTab === 'bans' && (
        <div className="space-y-6">
          <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Buscar usuario por nombre, gamertag o ID..." 
                className="w-full bg-slate-950 border border-[var(--border-card)] rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button size="sm" variant="outline" className="border-slate-700 w-full sm:w-auto">
                Filtrar por Juego
              </Button>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-500 text-white w-full sm:w-auto">
                <UserX className="w-4 h-4 mr-2" />
                Nuevo Ban
              </Button>
            </div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs uppercase font-black text-slate-500 border-b border-[var(--border-card)]">
                  <tr>
                    <th className="px-6 py-4">Usuario / Atleta</th>
                    <th className="px-6 py-4">Motivo de Sanción</th>
                    <th className="px-6 py-4">Juego</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-card)]">
                  {bannedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar fallback={user.name} size="md" status="offline" />
                          <div>
                            <div className="font-bold text-white uppercase">{user.name}</div>
                            <div className="text-[10px] text-cyan-400 font-mono">@{user.gamertag}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-rose-400 font-medium">{user.reason}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="slate" className="bg-slate-800 text-slate-300">{user.game}</Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400">{user.date}</td>
                      <td className="px-6 py-4">
                        <Badge variant={user.status === 'banned' ? 'rose' : 'gold'} className="uppercase text-[10px]">
                          {user.status === 'banned' ? 'Baneado' : 'Suspendido'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 h-8">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Desbanear
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bannedUsers.length === 0 && (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-50" />
                <p>No hay usuarios baneados actualmente.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENT: CHAT */}
      {activeTab === 'chat' && (
        <div className="h-[750px] relative rounded-xl overflow-hidden border border-[var(--border-card)] shadow-xl">
          <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Cargando sistema de chat...</div>}>
            <ChatSystem />
          </React.Suspense>
        </div>
      )}
      
    </div>
  );
}
