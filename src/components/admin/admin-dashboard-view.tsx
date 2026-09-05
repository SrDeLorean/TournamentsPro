'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Building2, Fingerprint, Plus, Shield, ShieldAlert, Trash2, Unlock, Users } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import {
  ManagementHero,
  ManagementPage,
  ManagementSection,
  ManagementTabs,
  type ManagementTab,
} from '@/components/dashboard/management-ui';
import { DashboardInsightMetrics, IdentityWarningsPanel, useDashboardInsights } from '@/components/dashboard/dashboard-insights';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import { ModalForm } from '@/components/ui/modal-form';
import { CreateOrganizationModal } from '@/features/organizations/components/create-organization-modal';
import { GAMES_CATALOG } from '@/lib/games-data';

interface AdminUser {
  id: string;
  name: string;
  gamertag: string;
  email: string;
  role: string;
  status: string;
  is_banned: number;
  ban_reason?: string | null;
  banned_at?: string | null;
}

interface AdminOrganization {
  id: string;
  name: string;
  tag: string;
  status?: string;
  organizers_count?: number;
  teams_count?: number;
  allowedGames?: string[];
}

interface AdminTeam {
  id: string;
  name: string;
  tag: string;
  game_slug: string;
  status?: string;
  is_banned: number;
  ban_reason?: string | null;
  captain_name?: string;
}

type AdminTab = 'users' | 'identity' | 'banned' | 'organizations' | 'teams';
type BanTarget = { kind: 'user' | 'team'; id: string; name: string; isBanned: boolean };

export function AdminDashboardView() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [banTarget, setBanTarget] = useState<BanTarget | null>(null);
  const [createOrgError, setCreateOrgError] = useState('');
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();
  const { insights, loading: insightsLoading, reload: reloadInsights } = useDashboardInsights();

  const fetchUsers = useCallback(async () => {
    const response = await fetch(`/api/admin/users${userRoleFilter ? `?role=${encodeURIComponent(userRoleFilter)}` : ''}`);
    const data = (await response.json()) as { success?: boolean; users?: AdminUser[] };
    if (data.success) setUsers(data.users ?? []);
  }, [userRoleFilter]);

  const fetchOrganizations = useCallback(async () => {
    const response = await fetch('/api/admin/organizations');
    const data = (await response.json()) as { success?: boolean; organizations?: AdminOrganization[] };
    if (data.success) setOrganizations(data.organizations ?? []);
  }, []);

  const fetchTeams = useCallback(async () => {
    const response = await fetch('/api/admin/teams');
    const data = (await response.json()) as { success?: boolean; teams?: AdminTeam[] };
    if (data.success) setTeams(data.teams ?? []);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchUsers).catch((error: unknown) => console.error('Error cargando usuarios:', error));
  }, [fetchUsers]);

  useEffect(() => {
    void Promise.resolve()
      .then(() => Promise.all([fetchOrganizations(), fetchTeams()]))
      .catch((error: unknown) => console.error('Error cargando datos administrativos:', error));
  }, [fetchOrganizations, fetchTeams]);

  const updateBan = async (kind: 'user' | 'team', id: string, isBanned: boolean, reason?: string) => {
    setBusyId(id);
    startOperation(`${isBanned ? 'Restauración' : 'Sanción'} de ${kind === 'user' ? 'usuario' : 'club'}`);
    try {
      const response = await fetch(kind === 'user' ? '/api/admin/users' : '/api/admin/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: isBanned ? 'UNBAN' : 'BAN', banReason: reason?.trim() || null }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar la sanción.');
      await Promise.all([kind === 'user' ? fetchUsers() : fetchTeams(), reloadInsights()]);
      endSuccess(isBanned ? 'El acceso fue restaurado correctamente.' : 'La sanción fue aplicada correctamente.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar la sanción.';
      endError(message);
      throw new Error(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateOrg = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const allowedGames = Object.keys(GAMES_CATALOG).filter((slug) => formData.get(`game_${slug}`));
    setCreateOrgError('');
    startOperation('Creación de organización');
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.get('name'), tag: formData.get('tag'), ownerId: currentUser?.id, allowedGames }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'No se pudo crear la organización.');
      form.reset();
      setIsCreatingOrg(false);
      await fetchOrganizations();
      endSuccess('La organización fue creada y ya está disponible en el directorio.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la organización.';
      setCreateOrgError(message);
      endError(message);
    }
  };

  const bannedUsers = useMemo(() => users.filter((user) => user.is_banned === 1), [users]);
  const bannedTeams = useMemo(() => teams.filter((team) => team.is_banned === 1), [teams]);
  const totalBanned = bannedUsers.length + bannedTeams.length;

  const tabs: ManagementTab<AdminTab>[] = [
    { id: 'users', label: 'Usuarios y roles', shortLabel: 'Usuarios', count: users.length, icon: Users, tone: 'cyan' },
    { id: 'identity', label: 'IDs similares', shortLabel: 'Alertas ID', count: insights?.identityWarnings.length ?? 0, icon: Fingerprint, tone: 'crimson' },
    { id: 'banned', label: 'Sanciones', count: totalBanned, icon: ShieldAlert, tone: 'crimson' },
    { id: 'organizations', label: 'Organizaciones', shortLabel: 'Orgs.', count: organizations.length, icon: Building2, tone: 'violet' },
    { id: 'teams', label: 'Clubes y escuadras', shortLabel: 'Clubes', count: teams.length, icon: Shield, tone: 'emerald' },
  ];

  return (
    <ManagementPage>
      <CrudAlertBanner state={crudState} onClose={resetAlert} />
      <ManagementHero
        eyebrow="Administración del sistema"
        title="Centro de control global"
        description="Supervisa identidades, organizaciones, clubes y sanciones desde una vista coherente con los temas del sistema."
        icon={Shield}
        tone="violet"
        badge={currentUser?.role || 'Administrador'}
      />

      <DashboardInsightMetrics insights={insights} loading={insightsLoading} />

      <ManagementTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} label="Módulos administrativos" />

      {activeTab === 'identity' ? <IdentityWarningsPanel warnings={insights?.identityWarnings ?? []} /> : null}

      {activeTab === 'users' ? (
        <ManagementSection
          title="Directorio de usuarios"
          description="Consulta roles, estados y aplica medidas de moderación."
          icon={Users}
          tone="cyan"
          action={
            <select value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)} className="ui-control h-10 w-full min-w-48 text-xs sm:w-auto" aria-label="Filtrar usuarios por rol">
              <option value="">Todos los roles</option>
              <option value="Administrador">Administrador</option>
              <option value="Organizador">Organizador</option>
              <option value="Jugador">Jugador</option>
            </select>
          }
        >
          <DataTable
            data={users}
            searchPlaceholder="Buscar por nombre, gamertag o correo..."
            brandColor="var(--app-accent)"
            columns={[
              { header: 'Usuario', cell: (user) => <div className="font-[family-name:var(--font-active)]"><p className="font-bold text-[var(--text-heading)]">{user.name}</p><p className="font-[family-name:var(--font-active)] text-[10px] text-[var(--app-accent)] font-bold">@{user.gamertag}</p></div> },
              { header: 'Correo', accessorKey: 'email', className: 'font-[family-name:var(--font-active)] text-[var(--text-secondary)]' },
              { header: 'Rol', cell: (user) => <Badge variant={user.role === 'Administrador' ? 'rose' : user.role === 'Organizador' ? 'violet' : 'cyan'}>{user.role}</Badge> },
              { header: 'Estado', cell: (user) => <Badge variant={user.is_banned ? 'rose' : 'emerald'}>{user.is_banned ? 'Baneado' : user.status}</Badge> },
            ]}
            actions={(user) => (
              <Button size="sm" variant="ghost" disabled={busyId === user.id} onClick={() => setBanTarget({ kind: 'user', id: user.id, name: user.gamertag, isBanned: user.is_banned === 1 })} className={user.is_banned ? 'text-[var(--app-positive)]' : 'text-[var(--app-danger)]'}>
                {user.is_banned ? <Unlock className="mr-1 size-3.5" /> : <Trash2 className="mr-1 size-3.5" />}{user.is_banned ? 'Restaurar' : 'Sancionar'}
              </Button>
            )}
          />
        </ManagementSection>
      ) : null}

      {activeTab === 'banned' ? (
        <div className="grid gap-5 2xl:grid-cols-2 font-[family-name:var(--font-active)]">
          <ManagementSection title="Usuarios sancionados" description="Perfiles sin acceso al sistema." icon={ShieldAlert} tone="crimson">
            <DataTable
              data={bannedUsers}
              searchPlaceholder="Buscar usuario sancionado..."
              brandColor="var(--app-danger)"
              columns={[
                { header: 'Usuario', cell: (user) => <div className="font-[family-name:var(--font-active)]"><p className="font-bold text-[var(--text-heading)]">@{user.gamertag}</p><p className="text-[10px] text-[var(--text-muted)]">{user.name}</p></div> },
                { header: 'Motivo', cell: (user) => <span className="text-[var(--text-secondary)] font-[family-name:var(--font-active)]">{user.ban_reason || 'Sin motivo indicado'}</span> },
                { header: 'Fecha', cell: (user) => <span className="font-[family-name:var(--font-active)] text-[var(--text-muted)]">{user.banned_at ? new Date(user.banned_at).toLocaleDateString() : 'N/A'}</span> },
              ]}
              actions={(user) => <Button size="sm" onClick={() => setBanTarget({ kind: 'user', id: user.id, name: user.gamertag, isBanned: true })} disabled={busyId === user.id}><Unlock className="mr-1 size-3.5" />Restaurar</Button>}
            />
          </ManagementSection>

          <ManagementSection title="Clubes sancionados" description="Escuadras suspendidas de la competición." icon={ShieldAlert} tone="crimson">
            <DataTable
              data={bannedTeams}
              searchPlaceholder="Buscar club sancionado..."
              brandColor="var(--app-danger)"
              columns={[
                { header: 'Club', cell: (team) => <span className="font-bold text-[var(--text-heading)] font-[family-name:var(--font-active)]">{team.name} [{team.tag}]</span> },
                { header: 'Disciplina', accessorKey: 'game_slug', className: 'font-[family-name:var(--font-active)] font-bold uppercase text-[var(--app-accent)]' },
                { header: 'Motivo', cell: (team) => <span className="text-[var(--text-secondary)] font-[family-name:var(--font-active)]">{team.ban_reason || 'Infracción disciplinaria'}</span> },
              ]}
              actions={(team) => <Button size="sm" onClick={() => setBanTarget({ kind: 'team', id: team.id, name: team.name, isBanned: true })} disabled={busyId === team.id}><Unlock className="mr-1 size-3.5" />Restaurar</Button>}
            />
          </ManagementSection>
        </div>
      ) : null}

      {activeTab === 'organizations' ? (
        <ManagementSection title="Organizaciones eSports" description="Ecosistema de ligas y torneos registrados." icon={Building2} tone="violet">
          <CreateOrganizationModal
            isOpen={isCreatingOrg}
            onClose={() => { setIsCreatingOrg(false); setCreateOrgError(''); }}
            onSuccess={() => fetchOrganizations()}
            currentUser={currentUser}
          />
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3 font-[family-name:var(--font-active)]">
            {organizations.map((organization) => (
              <article key={organization.id} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-subtle)] p-4 transition-colors hover:bg-[var(--bg-card-hover)] font-[family-name:var(--font-active)]">
                <div className="flex items-start justify-between gap-3"><div><h3 className="font-black uppercase text-[var(--text-heading)] font-[family-name:var(--font-active)]">{organization.name}</h3><p className="font-[family-name:var(--font-active)] font-bold text-xs text-[var(--app-accent-2)]">[{organization.tag}]</p></div><Badge variant="emerald">{organization.status || 'Activa'}</Badge></div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs font-[family-name:var(--font-active)]"><div><dt className="text-[var(--text-muted)]">Organizadores</dt><dd className="mt-1 font-black text-[var(--text-heading)]">{organization.organizers_count ?? 0}</dd></div><div><dt className="text-[var(--text-muted)]">Escuadras</dt><dd className="mt-1 font-black text-[var(--text-heading)]">{organization.teams_count ?? 0}</dd></div></dl>
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--border-card)] pt-3 font-[family-name:var(--font-active)]">{(organization.allowedGames ?? []).map((game) => <Badge key={game} variant="violet">{game}</Badge>)}</div>
              </article>
            ))}
          </div>
        </ManagementSection>
      ) : null}

      {activeTab === 'teams' ? (
        <ManagementSection title="Clubes y escuadras" description="Directorio competitivo y control disciplinario de clubes." icon={Shield} tone="emerald">
          <DataTable
            data={teams}
            searchPlaceholder="Buscar por club, tag o disciplina..."
            brandColor="var(--app-accent)"
            columns={[
              { header: 'Club', cell: (team) => <div className="font-[family-name:var(--font-active)]"><p className="font-bold text-[var(--text-heading)]">{team.name} [{team.tag}]</p><p className="text-[10px] text-[var(--text-muted)]">Capitán: {team.captain_name || 'Sin asignar'}</p></div> },
              { header: 'Disciplina', accessorKey: 'game_slug', className: 'font-[family-name:var(--font-active)] font-bold uppercase text-[var(--app-accent)]' },
              { header: 'Estado', cell: (team) => <Badge variant={team.is_banned ? 'rose' : 'emerald'}>{team.is_banned ? 'Baneado' : team.status || 'Activo'}</Badge> },
            ]}
            actions={(team) => <Button size="sm" variant={team.is_banned ? 'primary' : 'ghost'} disabled={busyId === team.id} onClick={() => setBanTarget({ kind: 'team', id: team.id, name: team.name, isBanned: team.is_banned === 1 })} className={team.is_banned ? '' : 'text-[var(--app-danger)]'}>{team.is_banned ? <Unlock className="mr-1 size-3.5" /> : <Trash2 className="mr-1 size-3.5" />}{team.is_banned ? 'Restaurar' : 'Sancionar'}</Button>}
          />
        </ManagementSection>
      ) : null}

      {banTarget ? (
        <ConfirmModal
          isOpen
          onClose={() => setBanTarget(null)}
          onConfirm={(reason) => updateBan(banTarget.kind, banTarget.id, banTarget.isBanned, reason)}
          title={banTarget.isBanned ? `Restaurar ${banTarget.name}` : `Sancionar ${banTarget.name}`}
          description={banTarget.isBanned ? 'El usuario o club recuperará el acceso a las funciones competitivas.' : 'Esta medida restringirá su acceso. Registra un motivo claro para conservar la trazabilidad administrativa.'}
          confirmText={banTarget.isBanned ? 'Restaurar acceso' : 'Aplicar sanción'}
          variant={banTarget.isBanned ? 'success' : 'danger'}
          requireReason={!banTarget.isBanned}
          reasonPlaceholder="Describe la infracción y el fundamento de la medida..."
          consequences={banTarget.isBanned ? ['Se reactivará el acceso inmediatamente.'] : ['El acceso competitivo quedará suspendido.', 'El motivo quedará visible en el historial administrativo.']}
        />
      ) : null}
    </ManagementPage>
  );
}
