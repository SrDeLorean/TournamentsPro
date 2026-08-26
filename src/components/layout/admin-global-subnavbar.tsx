'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import {
  Users, Shield, Building2, LayoutDashboard
} from 'lucide-react';

export function AdminGlobalSubnavbar() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdmin = roleStr === 'administrador' || roleStr === 'admin';

  // Only display if user is an Administrator
  if (!isAdmin) {
    return null;
  }

  const adminNavItems = [
    {
      label: 'Gestión de Usuarios',
      href: '/usuarios',
      icon: <Users className="w-4 h-4 text-cyan-400" />,
      badge: 'Global',
    },
    {
      label: 'Gestión de Equipos',
      href: '/equipos',
      icon: <Shield className="w-4 h-4 text-purple-400" />,
      badge: 'Multidisciplina',
    },
    {
      label: 'Gestión de Organizaciones',
      href: '/organizaciones',
      icon: <Building2 className="w-4 h-4 text-amber-400" />,
      badge: 'Madre',
    },
    {
      label: 'Panel General & Auditoría',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4 text-emerald-400" />,
      badge: 'Sistema',
    },
  ];

  return (
    <div className="w-full bg-slate-950/90 border-b border-cyan-500/40 backdrop-blur-md relative z-30 py-2.5 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left Branding Tag */}
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-white tracking-wider">
              PANEL DE CONTROL ADMINISTRATIVO
            </span>
            <Badge variant="cyan" className="text-[9px] px-1.5 py-0 uppercase font-mono font-bold">
              MODO ADMIN
            </Badge>
          </div>
        </div>

        {/* Center/Right Global Admin Nav Items */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 flex-shrink-0 ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-lg font-black'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                <span className="text-[9px] opacity-75 font-mono px-1 rounded bg-black/30">
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
