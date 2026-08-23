'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { User, BarChart2, FileText, Settings, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function UserAthleteSubnavbar() {
  const pathname = usePathname();
  const { currentUser, activeGameSlug } = useAuth();

  if (!currentUser) return null;

  const userId = currentUser?.id || 'usr-1784762163316';

  const userOptions = [
    { href: `/${activeGameSlug}/jugadores/${userId}`, label: 'Dashboard (Mi Ficha)', icon: <User className="w-3.5 h-3.5" /> },
    { href: `/${activeGameSlug}/mis-equipos`, label: 'Mis Equipos', icon: <Shield className="w-3.5 h-3.5 text-cyan-400" /> },
    { href: `/${activeGameSlug}/stats`, label: 'Mis Stats eSports', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { href: `/${activeGameSlug}/ofertas`, label: 'Mis Ofertas & Fichajes', icon: <FileText className="w-3.5 h-3.5" /> },
    { href: `/${activeGameSlug}/atleta-ajustes`, label: 'Ajustes de Perfil', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-full bg-slate-950/80 border-b border-cyan-500/30 backdrop-blur-md z-30 py-1.5 px-4 sm:px-6 lg:px-8 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
        
        {/* Label Badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            👤 OPCIONES DEL USUARIO (ATLETA):
          </span>
          <Badge variant="cyan" className="text-[9px] px-1.5 py-0 font-mono font-bold uppercase">
            @{currentUser?.gamertag || 'Atleta'}
          </Badge>
        </div>

        {/* Action Link Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {userOptions.map((opt) => {
            const isActive = pathname === opt.href || (opt.href.includes('/jugadores/') && pathname.includes('/jugadores/'));
            return (
              <Link
                key={opt.href}
                href={opt.href}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 flex-shrink-0 shadow-sm border ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md'
                    : 'bg-cyan-950/70 hover:bg-cyan-900 border-cyan-500/40 text-cyan-200'
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
