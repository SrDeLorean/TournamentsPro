'use client';

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Ban, CheckCircle2, Gamepad2, MessageSquare, RefreshCw, Shield, UserX, Users } from 'lucide-react';
import {
  banUserFromChatAction,
  getUsersByRoleAction,
  unbanUserFromChatAction,
} from '@/app/actions/chat';
import { ChatSystem } from '@/components/chat/chat-system';
import {
  ManagementHero,
  ManagementMetrics,
  ManagementPage,
  ManagementSection,
  ManagementTabs,
  MetricCard,
  type ManagementTab,
} from '@/components/dashboard/management-ui';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ModalForm } from '@/components/ui/modal-form';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import { GAMES_CATALOG } from '@/lib/games-data';

interface ModeratedUser {
  id: string;
  name: string;
  gamertag: string;
  role: string;
  gameSlug?: string | null;
  isBanned?: boolean;
  banReason?: string | null;
}

type ModerationTab = 'bans' | 'chat';
const MODERATED_ROLES = ['Administrador', 'Organizador', 'Capitan', 'Jugador'] as const;

export function ModerationDashboard() {
  const [activeTab, setActiveTab] = useState<ModerationTab>('bans');
  const [users, setUsers] = useState<ModeratedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserToRestore, setSelectedUserToRestore] = useState<ModeratedUser | null>(null);
  const [banReason, setBanReason] = useState('Infracción disciplinaria del reglamento eSports.');
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  const loadUsers = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const results = await Promise.all(MODERATED_ROLES.map((role) => getUsersByRoleAction(role)));
      const userMap = new Map<string, ModeratedUser>();
      for (const result of results) {
        if (!result.success) continue;
        for (const user of (result.data ?? []) as ModeratedUser[]) userMap.set(user.id, user);
      }
      setUsers([...userMap.values()].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error: unknown) {
      console.error('Error cargando usuarios para moderación:', error);
      endError('No fue posible cargar el directorio de moderación.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [endError]);

  useEffect(() => {
    void Promise.resolve().then(() => loadUsers());
  }, [loadUsers]);

  const bannedUsers = useMemo(() => users.filter((user) => user.isBanned), [users]);
  const availableUsers = useMemo(() => users.filter((user) => !user.isBanned && user.role !== 'Administrador'), [users]);
  const gamesUnderModeration = useMemo(() => new Set(users.map((user) => user.gameSlug).filter(Boolean)).size, [users]);

  const tabs: ManagementTab<ModerationTab>[] = [
    { id: 'bans', label: 'Cuentas y sanciones', shortLabel: 'Sanciones', count: bannedUsers.length, icon: Ban, tone: 'crimson' },
    { id: 'chat', label: 'Monitor de chat', shortLabel: 'Chat', icon: MessageSquare, tone: 'cyan' },
  ];

  const openBanModal = () => {
    setSelectedUserId(availableUsers[0]?.id ?? '');
    setBanReason('Infracción disciplinaria del reglamento eSports.');
    setIsBanModalOpen(true);
  };

  const handleBan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId || !banReason.trim()) return;
    const selectedUser = availableUsers.find((user) => user.id === selectedUserId);
    startOperation(`Aplicar sanción · @${selectedUser?.gamertag || selectedUserId}`);
    setIsSubmitting(true);
    const result = await banUserFromChatAction(selectedUserId, banReason.trim());
    setIsSubmitting(false);
    if (!result.success) {
      endError(result.error || 'No fue posible aplicar la sanción.');
      return;
    }
    setIsBanModalOpen(false);
    endSuccess(result.message || 'Sanción aplicada correctamente.');
    await loadUsers(true);
  };

  const handleUnban = async (user: ModeratedUser) => {
    startOperation(`Restaurar acceso · @${user.gamertag}`);
    setIsSubmitting(true);
    const result = await unbanUserFromChatAction(user.id);
    setIsSubmitting(false);
    if (!result.success) {
      endError(result.error || 'No fue posible levantar la sanción.');
      return;
    }
    setSelectedUserToRestore(null);
    endSuccess(`Se restauró el acceso de @${user.gamertag}.`);
    await loadUsers(true);
  };

  const gameFilters = Object.values(GAMES_CATALOG).map((game) => ({ label: game.name, value: game.slug }));

  return (
    <ManagementPage>
      <CrudAlertBanner state={crudState} onClose={resetAlert} />
      <ManagementHero
        eyebrow="Seguridad y convivencia"
        title="Centro de moderación"
        description="Gestiona sanciones reales, restaura accesos y supervisa conversaciones con controles protegidos y auditados."
        icon={Shield}
        tone="crimson"
        badge="Solo administración"
        actions={
          <Button onClick={openBanModal} disabled={availableUsers.length === 0} variant="danger" className="w-full sm:w-auto">
            <UserX className="size-4" />Nueva sanción
          </Button>
        }
      />

      <ManagementMetrics>
        <MetricCard label="Sanciones activas" value={bannedUsers.length} hint="Cuentas restringidas" icon={Ban} tone="crimson" />
        <MetricCard label="Usuarios supervisados" value={users.length} hint="Directorio real" icon={Users} tone="cyan" />
        <MetricCard label="Disciplinas" value={gamesUnderModeration} hint="Juegos con usuarios" icon={Gamepad2} tone="violet" />
        <MetricCard label="Estado operativo" value="En línea" hint="Acciones auditadas" icon={CheckCircle2} tone="emerald" />
      </ManagementMetrics>

      <ManagementTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} label="Módulos de moderación" />

      {activeTab === 'bans' ? (
        <ManagementSection
          title="Sanciones activas"
          description="Cuentas con acceso al chat suspendido. Las restauraciones se aplican inmediatamente."
          icon={AlertTriangle}
          tone="crimson"
          action={
            <Button variant="outline" onClick={() => void loadUsers(true)} disabled={isRefreshing} className="w-full sm:w-auto">
              <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />Actualizar
            </Button>
          }
        >
          <DataTable
            data={bannedUsers}
            searchPlaceholder="Buscar por nombre, gamertag, rol o disciplina..."
            filterOptions={[{ key: 'gameSlug', label: 'Disciplina', options: gameFilters }]}
            brandColor="var(--accent-crimson)"
            emptyMessage={isLoading ? 'Cargando sanciones...' : 'No hay sanciones activas.'}
            columns={[
              {
                header: 'Usuario',
                cell: (user) => (
                  <div className="flex items-center gap-3">
                    <Avatar fallback={user.name} size="md" status="offline" />
                    <div className="min-w-0"><p className="truncate font-bold text-[var(--text-heading)]">{user.name}</p><p className="truncate font-mono text-[10px] text-[var(--accent-cyan)]">@{user.gamertag}</p></div>
                  </div>
                ),
              },
              { header: 'Motivo', cell: (user) => <span className="text-[var(--accent-crimson)]">{user.banReason || 'Sanción disciplinaria'}</span> },
              { header: 'Disciplina', cell: (user) => <Badge variant="slate">{GAMES_CATALOG[user.gameSlug || '']?.name || user.gameSlug || 'Global'}</Badge> },
              { header: 'Rol', cell: (user) => <Badge variant={user.role === 'Organizador' ? 'violet' : 'cyan'}>{user.role}</Badge> },
              { header: 'Estado', cell: () => <Badge variant="rose">Baneado</Badge> },
            ]}
            actions={(user) => (
              <Button size="sm" variant="outline" disabled={isSubmitting} onClick={() => setSelectedUserToRestore(user)} className="text-[var(--accent-emerald)]">
                <CheckCircle2 className="size-3.5" />Restaurar
              </Button>
            )}
          />
        </ManagementSection>
      ) : null}

      {activeTab === 'chat' ? (
        <ManagementSection title="Monitor de chat" description="Canales, soporte y conversaciones disponibles según permisos." icon={MessageSquare} tone="cyan" className="[&>div:last-child]:p-0 sm:[&>div:last-child]:p-0">
          <div className="min-h-[32rem] overflow-hidden rounded-b-[var(--ui-radius-panel)]">
            <Suspense fallback={<div className="flex min-h-[32rem] items-center justify-center text-sm text-[var(--text-muted)]"><RefreshCw className="mr-2 size-4 animate-spin" />Cargando chat...</div>}>
              <ChatSystem />
            </Suspense>
          </div>
        </ManagementSection>
      ) : null}

      <ModalForm
        isOpen={isBanModalOpen}
        onClose={() => setIsBanModalOpen(false)}
        title="Aplicar sanción de chat"
        subtitle="El usuario perderá acceso y sus sesiones serán revocadas."
        onSubmit={handleBan}
        isSubmitting={isSubmitting}
        submitButtonText="Confirmar sanción"
        brandColor="var(--accent-crimson)"
        infoMessage="La acción quedará registrada en la auditoría de seguridad."
      >
        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase text-[var(--text-secondary)]">Usuario</span>
          <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} required className="ui-control h-11 w-full">
            {availableUsers.map((user) => <option key={user.id} value={user.id}>{user.name} (@{user.gamertag}) · {user.role}</option>)}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase text-[var(--text-secondary)]">Motivo</span>
          <textarea value={banReason} onChange={(event) => setBanReason(event.target.value)} required minLength={8} rows={4} className="ui-control w-full resize-y p-3" />
        </label>
      </ModalForm>
      <ConfirmModal
        isOpen={Boolean(selectedUserToRestore)}
        onClose={() => setSelectedUserToRestore(null)}
        onConfirm={() => selectedUserToRestore ? handleUnban(selectedUserToRestore) : Promise.resolve()}
        title="Restaurar acceso al chat"
        description={`Se levantará la sanción de @${selectedUserToRestore?.gamertag || 'este usuario'}.`}
        confirmText="Restaurar acceso"
        variant="success"
        consequences={['El usuario podrá volver a participar en los canales habilitados.', 'La restauración quedará registrada en la auditoría.']}
      />
    </ManagementPage>
  );
}
