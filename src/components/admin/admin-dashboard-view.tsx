'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Shield,
  Building2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Unlock,
  Gamepad2,
  Sparkles,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { GAMES_CATALOG } from '@/lib/games-data';

export function AdminDashboardView() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'banned' | 'organizations' | 'teams'>('users');

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Organizations State
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isCreatingOrg, setIsCreatingOrg] = useState<boolean>(false);

  // Teams State
  const [teams, setTeams] = useState<any[]>([]);

  const isAdmin = currentUser?.role === 'Administrador';
  const isOrganizer = currentUser?.role === 'Organizador';

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/users${userRoleFilter ? `?role=${userRoleFilter}` : ''}`);
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (e) {
      console.error('Error cargando usuarios:', e);
    }
  };

  // Fetch Organizations
  const fetchOrganizations = async () => {
    try {
      const res = await fetch('/api/admin/organizations');
      const data = await res.json();
      if (data.success) setOrganizations(data.organizations);
    } catch (e) {
      console.error('Error cargando organizaciones:', e);
    }
  };

  // Fetch Teams
  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/admin/teams');
      const data = await res.json();
      if (data.success) setTeams(data.teams);
    } catch (e) {
      console.error('Error cargando equipos:', e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
    fetchTeams();
  }, [userRoleFilter]);

  // Handle Ban / Unban User
  const handleBanUser = async (userId: string, isCurrentlyBanned: boolean) => {
    try {
      const action = isCurrentlyBanned ? 'UNBAN' : 'BAN';
      const reason = isCurrentlyBanned ? '' : prompt('Motivo del baneo de usuario:') || 'Infracción grave';
      if (!isCurrentlyBanned && !reason) return;

      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          action,
          banReason: reason,
          requesterRole: currentUser?.role,
        }),
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      console.error('Error baneando usuario:', e);
    }
  };

  // Handle Ban / Unban Team
  const handleBanTeam = async (teamId: string, isCurrentlyBanned: boolean) => {
    try {
      const action = isCurrentlyBanned ? 'UNBAN' : 'BAN';
      const reason = isCurrentlyBanned ? '' : prompt('Motivo del baneo de club:') || 'Violación de normas eSports';
      if (!isCurrentlyBanned && !reason) return;

      const res = await fetch('/api/admin/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: teamId,
          action,
          banReason: reason,
        }),
      });
      if (res.ok) fetchTeams();
    } catch (e) {
      console.error('Error baneando club:', e);
    }
  };

  // Handle Create Organization (Admin Only)
  const handleCreateOrg = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const selectedGames: string[] = [];
    Object.keys(GAMES_CATALOG).forEach((slug) => {
      if (formData.get(`game_${slug}`)) selectedGames.push(slug);
    });

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          tag: formData.get('tag'),
          ownerId: currentUser?.id,
          allowedGames: selectedGames,
          requesterRole: currentUser?.role,
        }),
      });

      if (res.ok) {
        setIsCreatingOrg(false);
        fetchOrganizations();
      }
    } catch (e) {
      console.error('Error creando organización:', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-cyan-950 border border-purple-500/30 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-900/60 border border-purple-400 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Shield className="w-7 h-7 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wider">
                Panel de Administración & Control General
              </h1>
              <Badge className="bg-purple-900 text-purple-300 border-purple-400 font-mono text-[10px] uppercase">
                {currentUser?.role || 'Administrador'}
              </Badge>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Gestión de usuarios por rol, estados dinámicos, menú de baneos y asignación de competencias a organizaciones.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'users' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          1. Usuarios & Roles ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('banned')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'banned' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          2. Menú de Desbaneo ({users.filter((u) => u.is_banned).length + teams.filter((t) => t.is_banned).length})
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('organizations')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'organizations' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            3. Organizaciones & Juegos ({organizations.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'teams' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'bg-slate-900 border border-white/10 text-slate-300'
          }`}
        >
          <Shield className="w-4 h-4" />
          4. Clubes & Escuadras ({teams.length})
        </button>
      </div>

      {/* TAB 1: GESTIÓN DE USUARIOS */}
      {activeTab === 'users' && (
        <Card className="p-6 bg-slate-950 border border-cyan-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Directorio General de Usuarios ({isAdmin ? 'Administrador: Control Total' : 'Organizador: Control de Jugadores'})
            </h3>

            <div className="flex items-center gap-2">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-cyan-300"
              >
                <option value="">Todos los Roles</option>
                <option value="Administrador">Administrador</option>
                <option value="Organizador">Organizador</option>
                <option value="Jugador">Jugador</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] font-mono">
                  <th className="p-3">Usuario / Gamertag</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold">{u.name}</div>
                      <div className="text-[10px] font-mono text-cyan-400">@{u.gamertag}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-300">{u.email}</td>
                    <td className="p-3">
                      <Badge
                        className={`text-[10px] uppercase font-mono ${
                          u.role === 'Administrador'
                            ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                            : u.role === 'Organizador'
                            ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                            : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                        }`}
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        className={`text-[10px] uppercase ${
                          u.is_banned
                            ? 'bg-rose-900 text-rose-200'
                            : u.status === 'Activo'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {u.is_banned ? '🔴 Baneado' : `🟢 ${u.status}`}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleBanUser(u.id, u.is_banned === 1)}
                        className={`text-xs font-bold ${
                          u.is_banned ? 'text-emerald-400 hover:bg-emerald-950' : 'text-rose-400 hover:bg-rose-950'
                        }`}
                      >
                        {u.is_banned ? <Unlock className="w-3.5 h-3.5 mr-1" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />}
                        {u.is_banned ? 'Desbanear' : 'Banear'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: MENÚ DE DESBANEO */}
      {activeTab === 'banned' && (
        <div className="space-y-6">
          {/* Usuarios Baneados */}
          <Card className="p-6 bg-slate-950 border border-rose-500/40 space-y-4">
            <h3 className="text-sm font-black uppercase text-rose-400 tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Lista de Usuarios Baneados & Sancionados
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] font-mono">
                    <th className="p-3">Gamertag</th>
                    <th className="p-3">Motivo del Baneo</th>
                    <th className="p-3">Fecha de Baneo</th>
                    <th className="p-3 text-right">Restaurar Acceso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white">
                  {users
                    .filter((u) => u.is_banned === 1)
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-rose-950/20">
                        <td className="p-3 font-bold text-rose-300">@{u.gamertag} ({u.name})</td>
                        <td className="p-3 text-slate-300 font-mono text-[11px]">{u.ban_reason || 'Sin motivo indicado'}</td>
                        <td className="p-3 text-slate-400 font-mono">{u.banned_at ? new Date(u.banned_at).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleBanUser(u.id, true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-lg"
                          >
                            <Unlock className="w-3.5 h-3.5 mr-1" />
                            Desbanear Usuario
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Clubes Baneados */}
          <Card className="p-6 bg-slate-950 border border-rose-500/40 space-y-4">
            <h3 className="text-sm font-black uppercase text-rose-400 tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Lista de Equipos / Clubes Baneados
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] font-mono">
                    <th className="p-3">Equipo</th>
                    <th className="p-3">Disciplina</th>
                    <th className="p-3">Motivo de Sanción</th>
                    <th className="p-3 text-right">Restaurar Club</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white">
                  {teams
                    .filter((t) => t.is_banned === 1)
                    .map((t) => (
                      <tr key={t.id} className="hover:bg-rose-950/20">
                        <td className="p-3 font-bold text-rose-300">{t.name} [{t.tag}]</td>
                        <td className="p-3 uppercase font-mono text-cyan-400">{t.game_slug}</td>
                        <td className="p-3 text-slate-300 font-mono text-[11px]">{t.ban_reason || 'Infracción disciplinaria'}</td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleBanTeam(t.id, true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-lg"
                          >
                            <Unlock className="w-3.5 h-3.5 mr-1" />
                            Desbanear Equipo
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: GESTIÓN DE ORGANIZACIONES (ADMIN ONLY) */}
      {activeTab === 'organizations' && isAdmin && (
        <Card className="p-6 bg-slate-950 border border-purple-500/40 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-purple-300 tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              Gestión de Organizaciones Madre & Permisos de Disciplina
            </h3>
            <Button
              onClick={() => setIsCreatingOrg(!isCreatingOrg)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-4 py-2 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nueva Organización
            </Button>
          </div>

          {/* Formulario de Creación */}
          {isCreatingOrg && (
            <form onSubmit={handleCreateOrg} className="p-4 rounded-xl bg-slate-900 border border-purple-400/40 space-y-4">
              <h4 className="text-xs font-black uppercase text-white">Crear Organización eSports:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                <input type="text" name="name" required placeholder="Nombre de la Organización" className="p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white" />
                <input type="text" name="tag" required maxLength={5} placeholder="Tag (ej. SL)" className="p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white uppercase" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase block">Disciplinas eSports Autorizadas a Gestionar:</label>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(GAMES_CATALOG).map(([slug, g]) => (
                    <label key={slug} className="flex items-center gap-2 text-xs font-semibold text-white bg-slate-950 p-2 rounded-lg border border-white/10 cursor-pointer">
                      <input type="checkbox" name={`game_${slug}`} defaultChecked />
                      <span>{g.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" className="bg-emerald-500 text-slate-950 font-black text-xs px-5 py-2 rounded-xl">
                Guardar Organización en MySQL
              </Button>
            </form>
          )}

          {/* Lista de Organizaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizations.map((org) => (
              <div key={org.id} className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm uppercase">{org.name} [{org.tag}]</span>
                  <Badge variant="cyan" className="font-mono text-[10px]">{org.status || 'Activa'}</Badge>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <p><strong>Organizadores Asociados:</strong> {org.organizers_count || 1}</p>
                  <p><strong>Escuadras del Club:</strong> {org.teams_count || 0}</p>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[10px] font-mono text-purple-300 font-bold uppercase block mb-1">Juegos Gestionables:</span>
                  <div className="flex flex-wrap gap-1">
                    {(org.allowedGames || []).map((gameSlug: string) => (
                      <span key={gameSlug} className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/30 uppercase">
                        {gameSlug}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: GESTIÓN DE EQUIPOS */}
      {activeTab === 'teams' && (
        <Card className="p-6 bg-slate-950 border border-emerald-500/30 space-y-4">
          <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Directorio eSports de Clubes & Escuadras
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-white text-sm uppercase">{t.name} [{t.tag}]</h4>
                  <p className="text-xs text-slate-400 uppercase font-mono">{t.game_slug} • Capitán: {t.captain_name}</p>
                  <Badge className={`mt-1 text-[10px] uppercase ${t.is_banned ? 'bg-rose-900 text-rose-200' : 'bg-emerald-950 text-emerald-300'}`}>
                    {t.is_banned ? '🔴 Baneado' : `🟢 ${t.status}`}
                  </Badge>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleBanTeam(t.id, t.is_banned === 1)}
                  className={`text-xs font-bold ${t.is_banned ? 'bg-emerald-600 text-slate-950' : 'bg-rose-950 text-rose-300 hover:bg-rose-900'}`}
                >
                  {t.is_banned ? 'Desbanear' : 'Banear Club'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
