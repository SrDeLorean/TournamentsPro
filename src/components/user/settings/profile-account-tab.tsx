'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Key } from 'lucide-react';
import type { UserProfile } from '@/lib/data-store';

interface ProfileAccountTabProps {
  name: string;
  setName: (n: string) => void;
  email: string;
  currentUser: UserProfile | null;
  nacionalidad: string;
  setNacionalidad: (n: string) => void;
  fechaNacimiento: string;
  setFechaNacimiento: (f: string) => void;
  isAdminOrOrganizer: boolean;
  role: UserProfile['role'];
  setRole: (r: UserProfile['role']) => void;
  status: string;
  setStatus: (s: string) => void;
  newPassword: string;
  setNewPassword: (p: string) => void;
  confirmPassword: string;
  setConfirmPassword: (p: string) => void;
}

export function ProfileAccountTab({
  name,
  setName,
  email,
  currentUser,
  nacionalidad,
  setNacionalidad,
  fechaNacimiento,
  setFechaNacimiento,
  isAdminOrOrganizer,
  role,
  setRole,
  status,
  setStatus,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
}: ProfileAccountTabProps) {
  return (
    <Card className="account-settings-card p-4 sm:p-6 space-y-6 border-[var(--app-positive)] bg-[var(--bg-card)]">
      <h3 className="text-sm font-black uppercase text-[var(--text-heading)] tracking-wider flex items-center gap-2">
        <User className="w-4 h-4 text-[var(--app-positive)]" />
        3. Información General del Sistema:
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <label className="font-bold text-[var(--text-secondary)] uppercase block">Nombre Completo del Usuario *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-positive)] font-semibold"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-[var(--text-muted)] uppercase block flex items-center gap-1">
            Correo Electrónico (No Modificable)
          </label>
          <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] flex items-center justify-between">
            <span className="font-semibold text-[var(--text-secondary)] ">{email || currentUser?.email || 'email@tournamentspro.com'}</span>
            <Badge variant="slate" className="text-[10px] ">Correo Registrado 🔒</Badge>
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-[var(--text-secondary)] uppercase block">Nacionalidad / País</label>
          <input
            type="text"
            value={nacionalidad}
            onChange={(e) => setNacionalidad(e.target.value)}
            placeholder="Ej. Chile, Argentina, México"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-positive)] font-semibold"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-[var(--text-secondary)] uppercase block">Fecha de Nacimiento</label>
          <input
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-positive)] font-semibold"
          />
        </div>

        {/* Rol en el Sistema (Solo editable por Organizador y Administrador) */}
        {isAdminOrOrganizer ? (
          <div className="space-y-1">
            <label className="font-bold text-[var(--text-secondary)] uppercase block flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[var(--app-warning)]" />
              Rol en el Sistema (Gestión Organizador/Admin)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserProfile['role'])}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--app-warning)] text-[var(--app-warning)] font-bold focus:outline-none"
            >
              <option value="Jugador">Jugador / Atleta</option>
              <option value="Capitán">Capitán de Club</option>
              <option value="Organizador">Organizador de Torneos</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
        ) : (
          <div className="space-y-1">
            <label className="font-bold text-[var(--text-muted)] uppercase block flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              Rol en el Sistema
            </label>
            <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] flex items-center justify-between">
              <span className="font-bold text-[var(--text-secondary)] uppercase">{currentUser?.role || role || 'Jugador'}</span>
              <Badge variant="cyan" className="text-[10px] ">Rol Protegido 🔒</Badge>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="font-bold text-[var(--text-secondary)] uppercase block">Estado en el Sistema</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-positive)] font-semibold"
          >
            <option value="Buscando Club">Buscando Club (Agente Libre)</option>
            <option value="En Escuadra">En Escuadra / Firmado</option>
            <option value="Organizador">Organizador Oficial</option>
          </select>
        </div>

        {/* Sección Cambiar Contraseña */}
        <div className="pt-4 border-t border-[var(--border-card)] col-span-1 sm:col-span-2 space-y-3">
          <h4 className="text-xs font-black uppercase text-[var(--app-warning)] tracking-wider flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-[var(--app-warning)]" />
            Cambiar Contraseña de Acceso:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-[var(--text-secondary)] uppercase block">Nueva Contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres (Dejar en blanco si no cambia)"
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-warning)] "
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[var(--text-secondary)] uppercase block">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-card)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--app-warning)] "
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
