'use client';

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Flag,
  Gamepad2,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  UserX,
  Users,
  X,
} from 'lucide-react';
import {
  banUserFromChatAction,
  getUsersByRoleAction,
  unbanUserFromChatAction,
  getChatReportsAction,
  resolveChatReportAction,
  getUserChatHistoryAction,
} from '@/app/actions/chat';
import type { ChatReportDTO, UserChatHistoryDTO, UserChatHistoryMessageItem } from '@/lib/services/types';
import dynamic from 'next/dynamic';

const ChatSystem = dynamic(
  () => import('@/components/chat/chat-system').then((m) => m.ChatSystem),
  { ssr: false }
);
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
import { Modal } from '@/components/ui/modal';
import { ModalForm } from '@/components/ui/modal-form';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import { GAMES_CATALOG } from '@/lib/games-data';

import { useAuth } from '@/components/providers/auth-provider';

interface ModeratedUser {
  id: string;
  name: string;
  gamertag: string;
  role: string;
  gameSlug?: string | null;
  isBanned?: boolean;
  banReason?: string | null;
}

type ModerationTab = 'reports' | 'bans' | 'users' | 'chat';
const MODERATED_ROLES = ['Administrador', 'Organizador', 'Capitan', 'Jugador'] as const;

export function ModerationDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ModerationTab>('reports');
  const [users, setUsers] = useState<ModeratedUser[]>([]);
  const [reports, setReports] = useState<ChatReportDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ban Modal states
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserToRestore, setSelectedUserToRestore] = useState<ModeratedUser | null>(null);
  const [banReason, setBanReason] = useState('Infracción disciplinaria del reglamento eSports.');
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);

  // Chat History Inspection Modal states
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<{ id: string; name: string; gamertag?: string | null } | null>(null);
  const [historyData, setHistoryData] = useState<UserChatHistoryDTO | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [copiedEvidence, setCopiedEvidence] = useState(false);

  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  const isOrganizer = currentUser?.role === 'Organizador';
  const isAdmin = currentUser?.role === 'Administrador';

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

  const loadReports = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const res = await getChatReportsAction();
      if (res.success && res.data) {
        setReports(res.data);
      }
    } catch (error: unknown) {
      console.error('Error cargando reportes:', error);
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      loadUsers();
      loadReports();
    });
  }, [loadUsers, loadReports]);

  // For Organizers, exclude Administrators and other Organizers
  const visibleModeratedUsers = useMemo(() => {
    if (isOrganizer && !isAdmin) {
      return users.filter((u) => u.role !== 'Administrador' && (u.role !== 'Organizador' || u.id === currentUser?.id));
    }
    return users;
  }, [users, isOrganizer, isAdmin, currentUser]);

  const bannedUsers = useMemo(() => visibleModeratedUsers.filter((user) => user.isBanned), [visibleModeratedUsers]);
  const availableUsers = useMemo(() => visibleModeratedUsers.filter((user) => !user.isBanned && user.role !== 'Administrador' && (user.role !== 'Organizador' || !isOrganizer)), [visibleModeratedUsers, isOrganizer]);
  const gamesUnderModeration = useMemo(() => new Set(visibleModeratedUsers.map((user) => user.gameSlug).filter(Boolean)).size, [visibleModeratedUsers]);
  const pendingReports = useMemo(() => reports.filter((r) => r.status === 'Pendiente'), [reports]);

  const tabs: ManagementTab<ModerationTab>[] = [
    {
      id: 'reports',
      label: 'Alertas y denuncias',
      shortLabel: 'Denuncias',
      count: pendingReports.length,
      icon: Flag,
      tone: pendingReports.length > 0 ? 'crimson' : 'gold',
    },
    {
      id: 'bans',
      label: 'Cuentas y sanciones',
      shortLabel: 'Sanciones',
      count: bannedUsers.length,
      icon: Ban,
      tone: 'crimson',
    },
    {
      id: 'users',
      label: 'Directorio de jugadores',
      shortLabel: 'Directorio',
      count: visibleModeratedUsers.length,
      icon: Users,
      tone: 'cyan',
    },
    {
      id: 'chat',
      label: 'Monitor de chat',
      shortLabel: 'Chat',
      icon: MessageSquare,
      tone: 'cyan',
    },
  ];

  const openBanModal = (defaultUserId?: string, defaultReason?: string, reportId?: string) => {
    setSelectedUserId(defaultUserId || availableUsers[0]?.id || '');
    setBanReason(defaultReason || 'Infracción disciplinaria del reglamento eSports.');
    setResolvingReportId(reportId || null);
    setIsBanModalOpen(true);
  };

  const handleBan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId || !banReason.trim()) return;
    const selectedUser = users.find((user) => user.id === selectedUserId);
    startOperation(`Aplicar sanción · @${selectedUser?.gamertag || selectedUserId}`);
    setIsSubmitting(true);

    const result = await banUserFromChatAction(selectedUserId, banReason.trim());
    if (!result.success) {
      setIsSubmitting(false);
      endError(result.error || 'No fue posible aplicar la sanción.');
      return;
    }

    if (resolvingReportId) {
      await resolveChatReportAction(resolvingReportId, 'Sancionado', `Sancionado con motivo: ${banReason.trim()}`);
      setResolvingReportId(null);
      await loadReports();
    }

    setIsSubmitting(false);
    setIsBanModalOpen(false);
    endSuccess(('message' in result && result.message) ? result.message : 'Sanción aplicada correctamente.');
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

  const handleDismissReport = async (report: ChatReportDTO) => {
    startOperation(`Descartar reporte · ID ${report.id.slice(0, 8)}`);
    setIsSubmitting(true);
    const result = await resolveChatReportAction(report.id, 'Descartado', 'Reporte desestimado por moderación.');
    setIsSubmitting(false);
    if (!result.success) {
      endError(result.error || 'No fue posible descartar el reporte.');
      return;
    }
    endSuccess('Denuncia descartada.');
    await loadReports();
  };

  const openUserHistory = async (userId: string, userName: string, userGamertag?: string | null) => {
    setSelectedUserForHistory({ id: userId, name: userName, gamertag: userGamertag });
    setIsLoadingHistory(true);
    setHistorySearch('');
    setCopiedEvidence(false);
    try {
      const res = await getUserChatHistoryAction(userId);
      if (res.success && res.data) {
        setHistoryData(res.data);
      } else {
        setHistoryData(null);
      }
    } catch (err) {
      console.error('Error al obtener historial:', err);
      setHistoryData(null);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCopyAllEvidence = () => {
    if (!historyData) return;
    const u = historyData.user;
    let text = `=== EVIDENCIA DE AUDITORÍA DE CHAT — TOURNAMENTSPRO ===\n`;
    text += `Usuario: ${u.name} (@${u.gamertag || 'sin_gamertag'})\n`;
    text += `ID de Usuario: ${u.id}\n`;
    text += `Rol: ${u.role} | Estado: ${u.status || 'Activo'}\n`;
    text += `Sancionado: ${u.isBanned ? `SÍ (${u.banReason || 'Sin motivo'})` : 'NO'}\n`;
    text += `Total de mensajes auditados: ${historyData.totalMessages}\n`;
    text += `Fecha de extracción: ${new Date().toLocaleString('es-ES')}\n\n`;
    text += `--- REGISTRO CRONOLÓGICO DE MENSAJES ---\n`;
    for (const msg of historyData.messages) {
      text += `[${msg.timestamp}] [${msg.threadTitle || msg.channelType}]: "${msg.messageText}"\n`;
    }
    navigator.clipboard.writeText(text);
    setCopiedEvidence(true);
    setTimeout(() => setCopiedEvidence(false), 2500);
  };

  const handleCopySingleMessage = (msg: UserChatHistoryMessageItem) => {
    const text = `[${msg.timestamp}] [${msg.threadTitle || msg.channelType}] @${historyData?.user?.gamertag || historyData?.user?.name}: "${msg.messageText}"`;
    navigator.clipboard.writeText(text);
    setCopiedEvidence(true);
    setTimeout(() => setCopiedEvidence(false), 2000);
  };

  const handleUseMessageToBan = (msg: UserChatHistoryMessageItem) => {
    if (!historyData) return;
    openBanModal(
      historyData.user.id,
      `Infracción en chat [${msg.timestamp}] en "${msg.threadTitle}": "${msg.messageText}"`
    );
  };

  const filteredHistoryMessages = useMemo(() => {
    if (!historyData) return [];
    if (!historySearch.trim()) return historyData.messages;
    const term = historySearch.toLowerCase();
    return historyData.messages.filter(
      (m) =>
        m.messageText.toLowerCase().includes(term) ||
        (m.threadTitle && m.threadTitle.toLowerCase().includes(term)) ||
        m.timestamp.toLowerCase().includes(term)
    );
  }, [historyData, historySearch]);

  const gameFilters = Object.values(GAMES_CATALOG).map((game) => ({ label: game.name, value: game.slug }));

  return (
    <ManagementPage>
      <CrudAlertBanner state={crudState} onClose={resetAlert} />
      <ManagementHero
        eyebrow="Seguridad, moderación y convivencia"
        title="Centro de moderación eSports"
        description="Gestiona sanciones, inspecciona el historial de conversaciones de jugadores, revisa denuncias en tiempo real y ratifica sanciones con evidencia respaldada."
        icon={Shield}
        tone="crimson"
        badge={isAdmin ? 'Administración' : 'Organización'}
        actions={
          <Button onClick={() => openBanModal()} disabled={availableUsers.length === 0} variant="danger" className="w-full sm:w-auto cursor-pointer">
            <UserX className="size-4" />Nueva sanción
          </Button>
        }
      />

      <ManagementMetrics>
        <MetricCard
          label="Denuncias pendientes"
          value={pendingReports.length}
          hint="Por revisar"
          icon={Flag}
          tone={pendingReports.length > 0 ? 'crimson' : 'emerald'}
        />
        <MetricCard label="Sanciones activas" value={bannedUsers.length} hint="Cuentas restringidas" icon={Ban} tone="crimson" />
        <MetricCard label="Usuarios supervisados" value={users.length} hint="Directorio activo" icon={Users} tone="cyan" />
        <MetricCard label="Disciplinas" value={gamesUnderModeration} hint="Juegos con atletas" icon={Gamepad2} tone="violet" />
      </ManagementMetrics>

      <ManagementTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} label="Módulos de moderación" />

      {/* ── TAB 1: ALERTAS Y DENUNCIAS ─────────────────────────────────── */}
      {activeTab === 'reports' && (
        <ManagementSection
          title="Alertas y denuncias de jugadores"
          description="Reportes generados por usuarios en los canales de chat. Puedes inspeccionar el historial completo del denunciado antes de sancionar o descartar."
          icon={Flag}
          tone={pendingReports.length > 0 ? 'crimson' : 'gold'}
          action={
            <Button variant="outline" onClick={() => void loadReports()} disabled={isLoadingReports} className="w-full sm:w-auto cursor-pointer">
              <RefreshCw className={`size-4 ${isLoadingReports ? 'animate-spin' : ''}`} />Actualizar denuncias
            </Button>
          }
        >
          <DataTable
            data={reports}
            searchPlaceholder="Buscar por denunciado, motivo o texto..."
            brandColor="var(--app-accent)"
            emptyMessage={isLoadingReports ? 'Cargando reportes...' : 'No hay denuncias registradas.'}
            columns={[
              {
                header: 'Denunciado',
                cell: (report) => (
                  <div className="flex items-center gap-2.5">
                    <Avatar fallback={report.reportedUserName} size="sm" />
                    <div className="min-w-0 font-[family-name:var(--font-active)]">
                      <p className="truncate font-bold text-xs text-[var(--text-heading)]">{report.reportedUserName}</p>
                      <button
                        type="button"
                        onClick={() => openUserHistory(report.reportedUserId, report.reportedUserName)}
                        className="text-[10px] text-[var(--app-accent)] hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-2.5 h-2.5" /> Ver historial
                      </button>
                    </div>
                  </div>
                ),
              },
              {
                header: 'Denunciante',
                cell: (report) => (
                  <div className="text-xs font-[family-name:var(--font-active)]">
                    <p className="font-bold text-[var(--text-heading)]">{report.reporterName}</p>
                    <Badge variant="slate" className="text-[9px] px-1 py-0">{report.reporterRole}</Badge>
                  </div>
                ),
              },
              {
                header: 'Motivo',
                cell: (report) => (
                  <Badge variant={report.status === 'Sancionado' ? 'rose' : 'gold'} className="font-bold">
                    {report.reason}
                  </Badge>
                ),
              },
              {
                header: 'Mensaje Denunciado',
                cell: (report) => (
                  <div className="max-w-xs space-y-1 font-[family-name:var(--font-active)]">
                    <p className="text-xs italic text-[var(--text-primary)] line-clamp-2 border-l-2 border-[var(--app-warning)] pl-2">
                      &quot;{report.messageText}&quot;
                    </p>
                    {report.details && (
                      <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">
                        Nota: {report.details}
                      </p>
                    )}
                  </div>
                ),
              },
              {
                header: 'Fecha',
                cell: (report) => (
                  <span className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                    {report.createdAt ? new Date(report.createdAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                ),
              },
              {
                header: 'Estado',
                cell: (report) => {
                  switch (report.status) {
                    case 'Sancionado':
                      return <Badge variant="rose">Sancionado</Badge>;
                    case 'Descartado':
                      return <Badge variant="slate">Descartado</Badge>;
                    default:
                      return <Badge variant="gold">Pendiente</Badge>;
                  }
                },
              },
            ]}
            actions={(report) => (
              <div className="flex items-center gap-1.5 font-[family-name:var(--font-active)]">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openUserHistory(report.reportedUserId, report.reportedUserName)}
                  title="Ver todo el historial de conversaciones de este jugador"
                  className="text-xs text-[var(--app-accent)] cursor-pointer"
                >
                  <Eye className="size-3.5" /> Historial
                </Button>
                {report.status === 'Pendiente' && (
                  <>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        openBanModal(
                          report.reportedUserId,
                          `Sanción por reporte: ${report.reason}. Mensaje denunciado: "${report.messageText}"`,
                          report.id
                        )
                      }
                      title="Ratificar sanción y banear al jugador"
                      className="text-xs cursor-pointer"
                    >
                      <Ban className="size-3.5" /> Sancionar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismissReport(report)}
                      disabled={isSubmitting}
                      title="Descartar reporte"
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                    >
                      <X className="size-3.5" /> Descartar
                    </Button>
                  </>
                )}
              </div>
            )}
          />
        </ManagementSection>
      )}

      {/* ── TAB 2: CUENTAS Y SANCIONES ─────────────────────────────────── */}
      {activeTab === 'bans' && (
        <ManagementSection
          title="Sanciones activas"
          description="Cuentas con acceso al chat suspendido. Las restauraciones se aplican inmediatamente."
          icon={AlertTriangle}
          tone="crimson"
          action={
            <Button variant="outline" onClick={() => void loadUsers(true)} disabled={isRefreshing} className="w-full sm:w-auto cursor-pointer">
              <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />Actualizar
            </Button>
          }
        >
          <DataTable
            data={bannedUsers}
            searchPlaceholder="Buscar por nombre, gamertag, rol o disciplina..."
            filterOptions={[{ key: 'gameSlug', label: 'Disciplina', options: gameFilters }]}
            brandColor="var(--app-danger)"
            emptyMessage={isLoading ? 'Cargando sanciones...' : 'No hay sanciones activas.'}
            columns={[
              {
                header: 'Usuario',
                cell: (user) => (
                  <div className="flex items-center gap-3">
                    <Avatar fallback={user.name} size="md" status="offline" />
                    <div className="min-w-0 font-[family-name:var(--font-active)]">
                      <p className="truncate font-bold text-[var(--text-heading)]">{user.name}</p>
                      <p className="truncate font-[family-name:var(--font-active)] font-bold text-[10px] text-[var(--app-accent)]">@{user.gamertag}</p>
                    </div>
                  </div>
                ),
              },
              { header: 'Motivo', cell: (user) => <span className="text-[var(--app-danger)] text-xs font-semibold">{user.banReason || 'Sanción disciplinaria'}</span> },
              { header: 'Disciplina', cell: (user) => <Badge variant="slate">{GAMES_CATALOG[user.gameSlug || '']?.name || user.gameSlug || 'Global'}</Badge> },
              { header: 'Rol', cell: (user) => <Badge variant={user.role === 'Organizador' ? 'violet' : 'cyan'}>{user.role}</Badge> },
              { header: 'Estado', cell: () => <Badge variant="rose">Baneado</Badge> },
            ]}
            actions={(user) => (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openUserHistory(user.id, user.name, user.gamertag)}
                  title="Inspeccionar historial de chat de este jugador"
                  className="text-xs text-[var(--app-accent)] cursor-pointer"
                >
                  <Eye className="size-3.5" />Historial
                </Button>
                <Button size="sm" variant="outline" disabled={isSubmitting} onClick={() => setSelectedUserToRestore(user)} className="text-[var(--app-positive)] cursor-pointer">
                  <CheckCircle2 className="size-3.5" />Restaurar
                </Button>
              </div>
            )}
          />
        </ManagementSection>
      )}

      {/* ── TAB 3: DIRECTORIO DE JUGADORES ─────────────────────────────── */}
      {activeTab === 'users' && (
        <ManagementSection
          title="Directorio de atletas y participantes"
          description="Supervisa todos los usuarios registrados, revisa su historial de chat en cualquier momento y gestiona sanciones de forma preventiva o ratificada."
          icon={Users}
          tone="cyan"
          action={
            <Button variant="outline" onClick={() => void loadUsers(true)} disabled={isRefreshing} className="w-full sm:w-auto cursor-pointer">
              <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />Actualizar lista
            </Button>
          }
        >
          <DataTable
            data={visibleModeratedUsers}
            searchPlaceholder="Buscar por nombre, gamertag, rol o disciplina..."
            filterOptions={[{ key: 'gameSlug', label: 'Disciplina', options: gameFilters }]}
            brandColor="var(--app-accent)"
            emptyMessage={isLoading ? 'Cargando directorio...' : 'No hay usuarios disponibles.'}
            columns={[
              {
                header: 'Usuario',
                cell: (user) => (
                  <div className="flex items-center gap-3 font-[family-name:var(--font-active)]">
                    <Avatar fallback={user.name} size="md" status={user.isBanned ? 'offline' : 'online'} />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-xs text-[var(--text-heading)]">{user.name}</p>
                      <p className="truncate font-bold text-[10px] text-[var(--app-accent)]">@{user.gamertag}</p>
                    </div>
                  </div>
                ),
              },
              { header: 'Disciplina', cell: (user) => <Badge variant="slate">{GAMES_CATALOG[user.gameSlug || '']?.name || user.gameSlug || 'Global'}</Badge> },
              { header: 'Rol', cell: (user) => <Badge variant={user.role === 'Organizador' ? 'violet' : user.role === 'Capitan' ? 'gold' : 'cyan'}>{user.role}</Badge> },
              {
                header: 'Estado de Chat',
                cell: (user) =>
                  user.isBanned ? (
                    <Badge variant="rose">Sancionado</Badge>
                  ) : (
                    <Badge variant="emerald">Habilitado</Badge>
                  ),
              },
            ]}
            actions={(user) => (
              <div className="flex items-center gap-1.5 font-[family-name:var(--font-active)]">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openUserHistory(user.id, user.name, user.gamertag)}
                  title="Ver todo el historial de conversaciones de este jugador"
                  className="text-xs text-[var(--app-accent)] cursor-pointer"
                >
                  <Eye className="size-3.5" />Historial
                </Button>
                {!user.isBanned ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => openBanModal(user.id)}
                    title="Aplicar sanción directa"
                    className="text-xs cursor-pointer"
                  >
                    <Ban className="size-3.5" />Sancionar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedUserToRestore(user)}
                    className="text-xs text-[var(--app-positive)] cursor-pointer"
                  >
                    <CheckCircle2 className="size-3.5" />Restaurar
                  </Button>
                )}
              </div>
            )}
          />
        </ManagementSection>
      )}

      {/* ── TAB 4: MONITOR DE CHAT ─────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <ManagementSection title="Monitor de chat" description="Canales, soporte y conversaciones disponibles según permisos." icon={MessageSquare} tone="cyan" className="[&>div:last-child]:p-0 sm:[&>div:last-child]:p-0">
          <div className="min-h-[32rem] overflow-hidden rounded-b-[var(--ui-radius-panel)]">
            <Suspense fallback={<div className="flex min-h-[32rem] items-center justify-center text-sm text-[var(--text-muted)]"><RefreshCw className="mr-2 size-4 animate-spin" />Cargando chat...</div>}>
              <ChatSystem />
            </Suspense>
          </div>
        </ManagementSection>
      )}

      {/* ── AUDIT MODAL: HISTORIAL DE CONVERSACIONES DEL JUGADOR ──────── */}
      {selectedUserForHistory && (
        <Modal
          isOpen
          onClose={() => setSelectedUserForHistory(null)}
          title={`Historial de Chat · ${selectedUserForHistory.name} (@${selectedUserForHistory.gamertag || 'atleta'})`}
          description="Auditoría cronológica de mensajes enviados por el usuario en todos los canales. Puedes copiar la evidencia o usar citas para ratificar sanciones."
          size="lg"
          className="p-6 space-y-4 font-[family-name:var(--font-active)] max-h-[85vh] flex flex-col"
        >
          {/* User Status Bar & Evidence Tools */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)]">
            <div className="flex items-center gap-3">
              <Avatar fallback={selectedUserForHistory.name} size="md" />
              <div>
                <p className="font-bold text-sm text-[var(--text-heading)]">{selectedUserForHistory.name}</p>
                <p className="text-xs text-[var(--app-accent)] font-semibold">@{selectedUserForHistory.gamertag}</p>
              </div>
              {historyData?.user?.isBanned && (
                <Badge variant="rose" className="ml-2">Cuenta Sancionada</Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyAllEvidence}
                disabled={!historyData || historyData.messages.length === 0}
                className="text-xs flex items-center gap-1.5 cursor-pointer"
                title="Copiar transcripción completa con marcas de tiempo para informe o foto"
              >
                {copiedEvidence ? <Check className="w-3.5 h-3.5 text-[var(--app-positive)]" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedEvidence ? '¡Evidencia copiada!' : 'Copiar evidencia completa'}
              </Button>

              {!historyData?.user?.isBanned && (
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => openBanModal(selectedUserForHistory.id)}
                  className="text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" /> Sancionar
                </Button>
              )}
            </div>
          </div>

          {/* Search messages in history */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Filtrar por texto del mensaje o canal..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--app-accent)] font-[family-name:var(--font-active)]"
            />
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto max-h-96 space-y-2.5 pr-1 font-[family-name:var(--font-active)]">
            {isLoadingHistory ? (
              <div className="py-12 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[var(--app-accent)]" />
                <span>Cargando historial auditado del jugador...</span>
              </div>
            ) : filteredHistoryMessages.length > 0 ? (
              filteredHistoryMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--app-accent)]/50 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--app-accent)]">{msg.threadTitle || 'Canal General'}</span>
                      {msg.gameSlug && <Badge variant="slate" className="text-[8px] py-0">{msg.gameSlug}</Badge>}
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopySingleMessage(msg)}
                        title="Copiar cita con timestamp"
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] rounded hover:bg-[var(--bg-main)] transition-colors cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUseMessageToBan(msg)}
                        title="Usar este mensaje como motivo oficial de baneo"
                        className="p-1 text-[var(--app-danger)] hover:bg-[var(--app-danger-soft)] rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                      >
                        <Ban className="w-3 h-3" />
                        <span className="hidden sm:inline">Usar para sanción</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium bg-[var(--bg-main)]/60 p-2.5 rounded-lg border border-[var(--border-card)]/60">
                    &quot;{msg.messageText}&quot;
                  </p>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-[var(--text-muted)] space-y-1">
                <ShieldAlert className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-40" />
                <p className="font-bold">No se registraron mensajes</p>
                <p>El usuario no ha emitido mensajes en los canales de chat o la búsqueda no arrojó resultados.</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[var(--border-card)] flex justify-between items-center text-xs text-[var(--text-muted)]">
            <span>Total auditado: <strong>{historyData?.totalMessages || 0}</strong> mensajes registrados</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUserForHistory(null)}
              className="text-xs cursor-pointer"
            >
              Cerrar visor
            </Button>
          </div>
        </Modal>
      )}

      {/* ── BAN MODAL ─────────────────────────────────────────────────── */}
      <ModalForm
        isOpen={isBanModalOpen}
        onClose={() => {
          setIsBanModalOpen(false);
          setResolvingReportId(null);
        }}
        title="Aplicar sanción de chat eSports"
        subtitle="El usuario perderá privilegios de envío de mensajes en todas las disciplinas y sus sesiones serán revocadas."
        onSubmit={handleBan}
        isSubmitting={isSubmitting}
        submitButtonText="Confirmar sanción"
        brandColor="var(--app-danger)"
        infoMessage="La acción quedará registrada en la auditoría de seguridad y ratificará las denuncias asociadas."
      >
        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase text-[var(--text-secondary)]">Usuario a sancionar</span>
          <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} required className="ui-control h-11 w-full font-[family-name:var(--font-active)]">
            {availableUsers.map((user) => <option key={user.id} value={user.id}>{user.name} (@{user.gamertag}) · {user.role}</option>)}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase text-[var(--text-secondary)]">Motivo oficial de la sanción</span>
          <textarea value={banReason} onChange={(event) => setBanReason(event.target.value)} required minLength={8} rows={4} className="ui-control w-full resize-y p-3 font-[family-name:var(--font-active)]" placeholder="Especifica la conducta, mensaje sancionado o regla infringida..." />
        </label>
      </ModalForm>

      {/* ── CONFIRM UNBAN MODAL ───────────────────────────────────────── */}
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

