'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getChatThreadsAction,
  getThreadMessagesAction,
  sendChatMessageAction,
  createOrGetDirectThreadAction,
  getUsersByRoleAction,
  banUserFromChatAction,
  checkUserBanStatusAction,
  updateTypingStatusAction,
  clearTypingStatusAction,
  getTypingUsersAction,
  reportChatMessageAction,
} from '@/app/actions/chat';
import {
  MessageSquare,
  Send,
  ShieldCheck,
  User,
  Trophy,
  Sparkles,
  X,
  Plus,
  Lock,
  LogIn,
  UserPlus,
  Crown,
  Search,
  RefreshCw,
  ShieldAlert,
  Users,
  Ban,
  ArrowLeft,
  Check,
  Flag,
} from 'lucide-react';

import { useSearchParams } from 'next/navigation';

interface ChatSystemProps {
  activeConvId?: string;
  initialTopic?: string;
  onClose?: () => void;
}

interface ChatThread {
  id: string;
  channelType?: string;
  gameSlug?: string;
  title: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  lastMessageAt: string;
  lastMessageText: string;
  unreadCount: number;
}

interface ChatMessageRecord {
  id: string;
  threadId?: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
}

interface RoleUser {
  id: string;
  name: string;
  gamertag: string;
  role: string;
}

export function ChatSystem({ activeConvId, initialTopic, onClose }: ChatSystemProps) {
  const { currentUser, activeGameSlug } = useAuth();
  const currentGameSlug = activeGameSlug || 'eafc26';
  const searchParams = useSearchParams();

  const urlTargetUserId = searchParams.get('targetUserId');
  const urlTargetUserName = searchParams.get('targetUserName');
  const urlTargetUserRole = searchParams.get('targetUserRole');
  const urlTopic = searchParams.get('topic') || initialTopic || '';

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>(activeConvId || '');
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(Boolean(activeConvId));
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'DIRECTO' | 'SOPORTE_ORGANIZADOR' | 'ANUNCIO_ADMIN'>('ALL');
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // Ban & Sanction States
  const [userBanInfo, setUserBanInfo] = useState<{ isBanned: boolean; reason: string | null }>({
    isBanned: false,
    reason: null,
  });
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReasonInput, setBanReasonInput] = useState('Infracción disciplinaria del reglamento eSports.');
  const [banningUser, setBanningUser] = useState(false);
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  // Denuncias y Reportes
  const [reportingMessage, setReportingMessage] = useState<ChatMessageRecord | null>(null);
  const [reportReason, setReportReason] = useState('Toxicidad / Lenguaje Ofensivo');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (currentUser?.id) {
      checkUserBanStatusAction(currentUser.id).then((res) => {
        if (res.success && res.data) {
          setUserBanInfo(res.data);
        }
      });
    }
  }, [currentUser?.id]);

  const canBanOthers = currentUser?.role === 'Administrador' || currentUser?.role === 'Organizador';

  // New Chat Form State
  const [newChatRole, setNewChatRole] = useState<'Organizador' | 'Administrador' | 'Capitan' | 'Jugador'>('Organizador');
  const [availableUsersForRole, setAvailableUsersForRole] = useState<RoleUser[]>([]);
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<string>('');
  const [loadingRoleUsers, setLoadingRoleUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const openNewChat = () => {
    setLoadingRoleUsers(true);
    setUserSearchQuery('');
    setShowNewChatModal(true);
  };

  const selectNewChatRole = (role: typeof newChatRole) => {
    setLoadingRoleUsers(true);
    setUserSearchQuery('');
    setNewChatRole(role);
  };

  // Fetch users matching selected role whenever modal opens or role changes
  useEffect(() => {
    if (showNewChatModal) {
      getUsersByRoleAction(newChatRole)
        .then((res) => {
          if (res.success && res.data && res.data.length > 0) {
            const visible = res.data.filter((u: RoleUser) => u.id !== currentUser?.id);
            setAvailableUsersForRole(visible);
            setSelectedTargetUserId(visible[0]?.id || '');
          } else {
            setAvailableUsersForRole([]);
            setSelectedTargetUserId('');
          }
        })
        .finally(() => setLoadingRoleUsers(false));
    }
  }, [newChatRole, showNewChatModal, currentUser?.id]);

  const filteredRoleUsers = availableUsersForRole.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.gamertag.toLowerCase().includes(q);
  });

  const effectiveTargetUserId = filteredRoleUsers.some((user) => user.id === selectedTargetUserId)
    ? selectedTargetUserId
    : filteredRoleUsers[0]?.id || '';

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load threads from MySQL DB
  const loadThreads = useCallback(() => {
    if (!currentUser) return;
    getChatThreadsAction(currentUser.id, currentUser.role || 'Jugador', currentGameSlug, channelFilter)
      .then((res) => {
        if (res.success && res.data) {
          setThreads(res.data);
          if (!selectedThreadId && res.data.length > 0) {
            setSelectedThreadId(res.data[0].id);
          }
        }
      })
      .finally(() => setLoadingThreads(false));
  }, [channelFilter, currentGameSlug, currentUser, selectedThreadId]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Auto-create or select thread if targetUserId is passed via URL query parameters (e.g. from Transfer Market)
  useEffect(() => {
    if (currentUser?.id && urlTargetUserId) {
      const targetName = urlTargetUserName || 'Atleta Anuncio';
      const targetRole = urlTargetUserRole || 'Jugador';
      createOrGetDirectThreadAction(
        currentUser.id,
        currentUser.name || 'Atleta',
        currentUser.role || 'Jugador',
        urlTargetUserId,
        targetName,
        targetRole,
        currentGameSlug,
        'DIRECTO',
        `Anuncio: ${urlTopic || targetName}`
      ).then((res) => {
        if (res.success && 'threadId' in res && res.threadId) {
          setSelectedThreadId(res.threadId);
          loadThreads();
          if (urlTopic) {
            setInputMessage(`Hola ${targetName}, vi tu anuncio sobre "${urlTopic}" en el Mercado de Traspasos y me interesa conversar.`);
          }
        }
      });
    }
  }, [currentUser, urlTargetUserId, urlTargetUserName, urlTargetUserRole, urlTopic, currentGameSlug, loadThreads]);

  // Load messages for selected thread
  const loadMessages = useCallback((threadId: string) => {
    if (!threadId) return;
    setLoadingMessages(true);
    getThreadMessagesAction(threadId)
      .then((res) => {
        if (res.success && res.data) {
          setMessages(res.data);
          setTimeout(scrollToBottom, 100);
        }
      })
      .finally(() => setLoadingMessages(false));
  }, [scrollToBottom]);

  useEffect(() => {
    if (selectedThreadId) {
      void Promise.resolve().then(() => loadMessages(selectedThreadId));
    }
  }, [selectedThreadId, loadMessages]);

  // Live Auto-Refresh Polling every 1.5 seconds (Optimized for Hostinger shared servers)
  useEffect(() => {
    if (!selectedThreadId || !currentUser) return;

    const interval = setInterval(() => {
      // 1. Poll incoming messages
      getThreadMessagesAction(selectedThreadId).then((res) => {
        if (res.success && res.data) {
          setMessages((prev) => {
            if (res.data.length !== prev.length || (res.data.length > 0 && prev.length > 0 && res.data[res.data.length - 1].id !== prev[prev.length - 1].id)) {
              setTimeout(scrollToBottom, 100);
              return res.data;
            }
            return prev;
          });
        }
      });

      // 2. Poll typing status of counter-party users
      getTypingUsersAction(selectedThreadId, currentUser.id).then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setTypingUsers(res.data);
        } else {
          setTypingUsers([]);
        }
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [selectedThreadId, currentUser, scrollToBottom]);

  const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputMessage(val);

    if (selectedThreadId && currentUser) {
      if (val.trim().length > 0) {
        updateTypingStatusAction(selectedThreadId, currentUser.id, currentUser.name || currentUser.gamertag || 'Usuario');
      } else {
        clearTypingStatusAction(selectedThreadId, currentUser.id);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeThread || !currentUser) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    if (selectedThreadId && currentUser) {
      clearTypingStatusAction(selectedThreadId, currentUser.id);
    }

    // Optimistic UI insert (0ms instant local rendering)
    const tempMsg = {
      id: `temp-${Date.now()}`,
      threadId: activeThread.id,
      senderId: currentUser.id,
      senderName: currentUser.name || 'Tú',
      senderRole: currentUser.role || 'Jugador',
      text: textToSend,
      timestamp: 'Ahora',
    };
    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      await sendChatMessageAction(
        activeThread.id,
        currentUser.id,
        currentUser.name || 'Tú',
        currentUser.role || 'Jugador',
        textToSend
      );
      loadMessages(activeThread.id);
      loadThreads();
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
    } finally {
      setSending(false);
    }
  };

  const handleBanTargetUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread?.participantId) return;

    setBanningUser(true);
    try {
      const res = await banUserFromChatAction(activeThread.participantId, banReasonInput);
      if (res.success) {
        setActionNotification(`El usuario ${activeThread.participantName} ha sido baneado del chat exitosamente.`);
        setShowBanModal(false);
        loadThreads();
      } else {
        setActionNotification(res.error || 'No se pudo banear al usuario del chat.');
      }
    } finally {
      setBanningUser(false);
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingMessage || !activeThread) return;

    setSubmittingReport(true);
    setReportFeedback(null);

    try {
      const res = await reportChatMessageAction({
        threadId: activeThread.id,
        messageId: reportingMessage.id,
        messageText: reportingMessage.text,
        reportedUserId: reportingMessage.senderId,
        reportedUserName: reportingMessage.senderName,
        reason: reportReason,
        details: reportDetails,
      });

      if (res.success) {
        setReportFeedback({
          type: 'success',
          message: '¡Denuncia registrada! Los administradores y organizadores revisarán este reporte.',
        });
        setTimeout(() => {
          setReportingMessage(null);
          setReportFeedback(null);
          setReportDetails('');
        }, 2200);
      } else {
        setReportFeedback({
          type: 'error',
          message: res.error || 'Ocurrió un error al registrar la denuncia.',
        });
      }
    } catch {
      setReportFeedback({
        type: 'error',
        message: 'Error inesperado al comunicarse con el servidor.',
      });
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const targetUserObj = filteredRoleUsers.find((u) => u.id === effectiveTargetUserId) || filteredRoleUsers[0] || availableUsersForRole[0];
    if (!targetUserObj) {
      setActionNotification('No hay un usuario real disponible para iniciar este chat.');
      return;
    }

    const targetId = targetUserObj.id;
    const targetName = targetUserObj.name;

    const res = await createOrGetDirectThreadAction(
      currentUser.id,
      currentUser.name || 'Tú',
      currentUser.role || 'Jugador',
      targetId,
      targetName,
      targetUserObj?.role || newChatRole,
      currentGameSlug,
      'DIRECTO',
      `Chat con ${targetName}`
    );

    if (res.success && 'threadId' in res && res.threadId) {
      setSelectedThreadId(res.threadId);
      setShowNewChatModal(false);
      loadThreads();
    } else if (!res.success && 'error' in res && res.error) {
      setActionNotification(res.error);
    }
  };

  const filteredThreads = threads.filter((t) => {
    const titleMatch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const participantMatch = t.participantName.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || participantMatch;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Administrador':
        return 'rose';
      case 'Organizador':
        return 'emerald';
      case 'Capitán':
      case 'Capitan':
        return 'gold';
      default:
        return 'cyan';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Administrador':
        return <ShieldCheck className="w-3 h-3 text-[var(--app-danger)]" />;
      case 'Organizador':
        return <Trophy className="w-3 h-3 text-[var(--app-positive)]" />;
      case 'Capitán':
      case 'Capitan':
        return <Crown className="w-3 h-3 text-[var(--app-warning)]" />;
      default:
        return <User className="w-3 h-3 text-[var(--app-accent)]" />;
    }
  };

  if (!currentUser) {
    return (
      <Card className="p-8 text-center space-y-5 max-w-lg mx-auto bg-[var(--bg-card)] border-[var(--border-card)] rounded-3xl shadow-2xl font-[family-name:var(--font-active)]">
        <div className="w-16 h-16 rounded-3xl bg-[var(--app-warning-soft)] border border-[var(--app-warning)] flex items-center justify-center text-[var(--app-warning)] mx-auto shadow-lg">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 font-[family-name:var(--font-active)]">
          <h3 className="text-lg font-bold text-[var(--text-heading)] uppercase font-[family-name:var(--font-active)]">
            Autenticación Requerida
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed font-[family-name:var(--font-active)]">
            Inicia sesión con tu cuenta para acceder a la mensajería interna eSports, contactar capitanes de equipos y comunicarte con organizadores.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 font-[family-name:var(--font-active)]">
          <Link href="/login" className="w-full">
            <Button className="w-full text-xs font-[family-name:var(--font-active)] font-bold bg-[var(--app-accent)] text-[var(--accent-contrast)] hover:brightness-110 flex items-center justify-center gap-1.5">
              <LogIn className="w-4 h-4" />
              Iniciar Sesión
            </Button>
          </Link>
          <Link href="/registro" className="w-full">
            <Button variant="outline" className="w-full text-xs font-[family-name:var(--font-active)] border-[var(--border-card)] flex items-center justify-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              Crear Cuenta
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative grid h-[calc(100dvh-10rem)] min-h-[32rem] w-full grid-cols-1 overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xl md:h-[700px] md:grid-cols-12 md:rounded-3xl font-[family-name:var(--font-active)]">
      {actionNotification && (
        <div className="absolute top-3 right-3 z-50 max-w-sm p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--app-accent)] shadow-2xl flex items-center justify-between gap-3 text-xs font-[family-name:var(--font-active)]">
          <span>{actionNotification}</span>
          <button onClick={() => setActionNotification(null)} className="text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* 📁 LEFT SIDEBAR: Channels & Contacts */}
      <div className={`${isMobileConversationOpen ? 'hidden md:flex' : 'flex'} flex-col justify-between border-r border-[var(--border-card)] bg-[var(--bg-card)] md:col-span-4 font-[family-name:var(--font-active)]`}>
        <div className="p-4 border-b border-[var(--border-card)] space-y-3 font-[family-name:var(--font-active)]">
          <div className="flex items-center justify-between font-[family-name:var(--font-active)]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[var(--app-accent)]" />
              <h3 className="font-extrabold text-sm uppercase tracking-tight text-[var(--text-heading)] font-[family-name:var(--font-active)]">
                Mensajería eSports
              </h3>
            </div>

            <div className="flex items-center gap-1 font-[family-name:var(--font-active)]">
              <button
                onClick={openNewChat}
                className="p-1.5 rounded-xl bg-[color-mix(in_srgb,var(--app-accent)_16%,transparent)] text-[var(--app-accent)] hover:brightness-110 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer font-[family-name:var(--font-active)]"
                title="Nuevo Chat Directo"
              >
                <Plus className="w-4 h-4" />
              </button>
              {onClose && (
                <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer font-[family-name:var(--font-active)]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search Contacts */}
          <div className="relative font-[family-name:var(--font-active)]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar atletas, capitanes, organizadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs font-[family-name:var(--font-active)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--app-accent)]"
            />
          </div>

          {/* 🏷️ Role Channel Filter Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[var(--bg-main)]/60 rounded-xl border border-[var(--border-card)] text-[10px] font-[family-name:var(--font-active)] font-bold">
            <button
              onClick={() => setChannelFilter('ALL')}
              className={`py-1 rounded-lg transition-all font-[family-name:var(--font-active)] cursor-pointer ${
                channelFilter === 'ALL'
                  ? 'bg-[var(--app-accent)] text-[var(--accent-contrast)] font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
              }`}
            >
              TODOS
            </button>
            <button
              onClick={() => setChannelFilter('DIRECTO')}
              className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 font-[family-name:var(--font-active)] cursor-pointer ${
                channelFilter === 'DIRECTO'
                  ? 'bg-[var(--app-accent)] text-[var(--accent-contrast)] font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
              }`}
            >
              <Users className="w-3 h-3" />
              DIRECTO
            </button>
            <button
              onClick={() => setChannelFilter('SOPORTE_ORGANIZADOR')}
              className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 font-[family-name:var(--font-active)] cursor-pointer ${
                channelFilter === 'SOPORTE_ORGANIZADOR'
                  ? 'bg-[var(--app-positive)] text-[var(--accent-contrast)] font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
              }`}
            >
              <Trophy className="w-3 h-3" />
              ORGS
            </button>
            <button
              onClick={() => setChannelFilter('ANUNCIO_ADMIN')}
              className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 font-[family-name:var(--font-active)] cursor-pointer ${
                channelFilter === 'ANUNCIO_ADMIN'
                  ? 'bg-[var(--app-danger)] text-[var(--text-heading)] font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              ADMIN
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-card)] font-[family-name:var(--font-active)]">
          {loadingThreads ? (
            <div className="py-12 text-center text-xs font-[family-name:var(--font-active)] text-[var(--text-muted)] flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[var(--app-accent)]" />
              <span>Cargando canales eSports...</span>
            </div>
          ) : filteredThreads.length > 0 ? (
            filteredThreads.map((thread) => {
              const isSelected = thread.id === selectedThreadId;
              return (
                <button
                  key={thread.id}
                  onClick={() => {
                    setSelectedThreadId(thread.id);
                    setIsMobileConversationOpen(true);
                  }}
                  className={`w-full p-3.5 text-left flex items-start gap-3 transition-all font-[family-name:var(--font-active)] cursor-pointer ${
                    isSelected
                      ? 'bg-[color-mix(in_srgb,var(--app-accent)_16%,transparent)] border-l-4 border-[var(--app-accent)]'
                      : 'hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  <Avatar fallback={thread.participantName} status="online" size="md" />

                  <div className="flex-1 min-w-0 space-y-1 font-[family-name:var(--font-active)]">
                    <div className="flex items-center justify-between font-[family-name:var(--font-active)]">
                      <span className="font-extrabold text-xs text-[var(--text-heading)] truncate flex items-center gap-1 font-[family-name:var(--font-active)]">
                        {getRoleIcon(thread.participantRole)}
                        <span className="truncate">{thread.title}</span>
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-[family-name:var(--font-active)]">{thread.lastMessageAt}</span>
                    </div>

                    <div className="flex items-center justify-between font-[family-name:var(--font-active)]">
                      <Badge variant={getRoleBadgeVariant(thread.participantRole)} className="text-[9px] px-1.5 py-0 font-[family-name:var(--font-active)]">
                        {thread.participantRole}
                      </Badge>
                      {thread.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-[var(--app-accent)] text-[var(--accent-contrast)] font-extrabold text-[10px] flex items-center justify-center font-[family-name:var(--font-active)]">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[var(--text-muted)] truncate font-[family-name:var(--font-active)]">
                      {thread.lastMessageText}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs font-[family-name:var(--font-active)] text-[var(--text-muted)] space-y-2 p-4">
              <MessageSquare className="w-8 h-8 mx-auto opacity-40 text-[var(--app-accent)]" />
              <p>No se encontraron conversaciones activas en esta categoría.</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-[var(--border-card)] bg-[var(--bg-main)] text-[10px] text-[var(--text-muted)] font-[family-name:var(--font-active)] text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--app-positive)]" />
          <span>Chat en Vivo Auditado | TournamentsPro eSports</span>
        </div>
      </div>

      {/* 💬 RIGHT DISPLAY: Active Chat Messages */}
      <div className={`${isMobileConversationOpen ? 'flex' : 'hidden md:flex'} flex-col justify-between bg-[var(--bg-main)] md:col-span-8 font-[family-name:var(--font-active)]`}>
        {activeThread ? (
          <>
            {/* Header of Active Conversation */}
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border-card)] bg-[var(--bg-card)] p-3 sm:p-4 font-[family-name:var(--font-active)]">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button type="button" onClick={() => setIsMobileConversationOpen(false)} className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-card)] text-[var(--text-secondary)] md:hidden cursor-pointer" aria-label="Volver a conversaciones">
                  <ArrowLeft className="size-4" />
                </button>
                <Avatar fallback={activeThread.participantName} status="online" size="md" />
                <div className="min-w-0 font-[family-name:var(--font-active)]">
                  <div className="flex min-w-0 items-center gap-2 font-[family-name:var(--font-active)]">
                    <h4 className="flex min-w-0 items-center gap-1.5 truncate text-xs font-extrabold uppercase text-[var(--text-heading)] sm:text-sm font-[family-name:var(--font-active)]">
                      {getRoleIcon(activeThread.participantRole)}
                      <span className="truncate">{activeThread.title}</span>
                    </h4>
                    <Badge variant={getRoleBadgeVariant(activeThread.participantRole)} className="hidden text-[10px] font-[family-name:var(--font-active)] sm:inline-flex">
                      {activeThread.participantRole}
                    </Badge>
                  </div>
                  <p className="truncate font-[family-name:var(--font-active)] text-[10px] text-[var(--text-muted)] sm:text-xs">
                    Contacto: {activeThread.participantName} | Canal eSports
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 font-[family-name:var(--font-active)]">
                {canBanOthers && activeThread && activeThread.participantId !== 'usr-all' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowBanModal(true)}
                    className="text-[11px] font-[family-name:var(--font-active)] border-[var(--app-danger)] text-[var(--app-danger)] hover:bg-[var(--app-danger-soft)] flex items-center gap-1 h-8 rounded-xl cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Banear usuario</span>
                  </Button>
                )}
                <span className="hidden items-center gap-1 text-[11px] font-bold text-[var(--app-positive)] xl:flex font-[family-name:var(--font-active)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--app-positive)] animate-pulse" />
                  En Línea
                </span>
              </div>
            </div>

            {/* Messages Display Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-[family-name:var(--font-active)]">
              {loadingMessages && messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2 font-[family-name:var(--font-active)]">
                  <RefreshCw className="w-4 h-4 animate-spin text-[var(--app-accent)]" />
                  <span>Cargando historial de mensajes...</span>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  const senderRoleVariant = getRoleBadgeVariant(msg.senderRole);

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'} font-[family-name:var(--font-active)]`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[var(--text-muted)] font-bold font-[family-name:var(--font-active)]">
                        <span>{msg.senderName}</span>
                        <Badge variant={senderRoleVariant} className="text-[8px] px-1 py-0 font-[family-name:var(--font-active)]">
                          {msg.senderRole}
                        </Badge>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                        {!isMe && (
                          <button
                            type="button"
                            onClick={() => {
                              setReportingMessage(msg);
                              setReportFeedback(null);
                              setReportDetails('');
                              setReportReason('Toxicidad / Lenguaje Ofensivo');
                            }}
                            title="Reportar mensaje a moderadores"
                            className="ml-1 p-0.5 text-[var(--text-muted)] hover:text-[var(--app-danger)] transition-colors rounded hover:bg-[var(--bg-card-hover)] flex items-center gap-1 cursor-pointer"
                          >
                            <Flag className="w-2.5 h-2.5" />
                            <span className="text-[9px] hover:underline">Reportar</span>
                          </button>
                        )}
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-md font-[family-name:var(--font-active)] ${
                          isMe
                            ? 'bg-[var(--app-accent)] text-[var(--accent-contrast)] rounded-br-none font-bold'
                            : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-heading)] rounded-bl-none font-medium'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center text-xs text-[var(--text-muted)] space-y-2 font-[family-name:var(--font-active)]">
                  <Sparkles className="w-8 h-8 text-[var(--app-accent)] mx-auto opacity-50" />
                  <p className="font-bold">Inicia la conversación</p>
                  <p>Envía tu primer mensaje para acordar fichajes o realizar consultas de torneo.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Message Form OR Ban Guard Banner */}
            {activeThread.channelType === 'ANUNCIO_ADMIN' && currentUser?.role !== 'Administrador' ? (
              <div className="p-3.5 border-t border-[var(--border-card)] bg-[var(--bg-main)] text-[var(--text-muted)] font-[family-name:var(--font-active)] text-xs flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-[var(--app-warning)] shrink-0" />
                <span className="font-bold text-[var(--text-heading)]">Canal oficial de boletines de Administración. Solo lectura.</span>
              </div>
            ) : userBanInfo.isBanned ? (
              <div className="p-3.5 border-t border-[var(--app-danger)] bg-[var(--app-danger-soft)] text-[var(--app-danger)] font-[family-name:var(--font-active)] text-xs flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-[var(--app-danger)] shrink-0 animate-pulse" />
                <div className="font-[family-name:var(--font-active)]">
                  <strong className="block text-[var(--text-heading)] font-bold uppercase text-[11px] font-[family-name:var(--font-active)]">
                    🚫 CUENTA SANCIONADA Y BANEADA DEL CHAT ESPORTS
                  </strong>
                  <p className="text-[10px] text-[var(--app-danger)] font-[family-name:var(--font-active)]">
                    Has sido sancionado por la administración y tus privilegios de envío de mensajes se encuentran suspendidos. Motivo: &quot;{userBanInfo.reason || 'Infracción de reglamento eSports.'}&quot;
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-t border-[var(--border-card)] bg-[var(--bg-card)] font-[family-name:var(--font-active)]">
                {/* INDICADOR DE USUARIO ESCRIBIENDO */}
                {typingUsers.length > 0 && (
                  <div className="px-4 py-2 bg-[color-mix(in_srgb,var(--app-accent)_12%,transparent)] border-b border-[var(--app-accent)]/30 text-[var(--app-accent)] font-[family-name:var(--font-active)] text-[11px] flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-2 font-[family-name:var(--font-active)]">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--app-accent)] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--app-accent)]" />
                      </span>
                      <span className="font-bold text-[var(--text-heading)] font-[family-name:var(--font-active)]">
                        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'está escribiendo' : 'están escribiendo'}...
                      </span>
                    </div>
                    <div className="flex gap-1 items-center font-[family-name:var(--font-active)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--app-accent)] animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--app-accent)] animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--app-accent)] animate-bounce" />
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="p-3 flex items-center gap-2 font-[family-name:var(--font-active)]">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={handleInputChange}
                    placeholder={`Escribir mensaje a ${activeThread.participantName}...`}
                    className="flex-1 h-10 px-4 rounded-[var(--radius-control)] bg-[var(--bg-main)] border border-[var(--border-card)] text-xs font-[family-name:var(--font-active)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--app-accent)]"
                  />
                  <Button
                    type="submit"
                    disabled={sending || !inputMessage.trim()}
                    className="h-10 px-4 font-[family-name:var(--font-active)] font-bold text-xs bg-[var(--app-accent)] text-[var(--accent-contrast)] hover:brightness-110 flex items-center gap-1.5 rounded-[var(--radius-control)] shadow-md cursor-pointer"
                  >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? 'Enviando...' : 'Enviar'}
                </Button>
              </form>
            </div>
          )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)] space-y-3 font-[family-name:var(--font-active)]">
            <MessageSquare className="w-12 h-12 text-[var(--app-accent)] opacity-50 mx-auto" />
            <h4 className="text-base font-bold text-[var(--text-heading)] font-[family-name:var(--font-active)]">Selecciona o Inicia una Conversación</h4>
            <p className="text-xs max-w-sm font-[family-name:var(--font-active)]">
              Conecta directamente con Atletas, Capitanes de Equipos o la Mesa de Organizadores eSports.
            </p>
            <Button
              size="sm"
              onClick={openNewChat}
              className="text-xs font-[family-name:var(--font-active)] font-bold bg-[var(--app-accent)] text-[var(--accent-contrast)] cursor-pointer"
            >
              + Iniciar Nuevo Chat
            </Button>
          </div>
        )}
      </div>

      {/* ── NEW CHAT MODAL ────────────────────────────────────────────── */}
      {showNewChatModal && (
        <Modal isOpen onClose={() => setShowNewChatModal(false)} ariaLabel="Nuevo chat directo" size="sm" showCloseButton={false} className="p-6 space-y-5 font-[family-name:var(--font-active)]">
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3 font-[family-name:var(--font-active)]">
              <div className="flex items-center gap-2 font-[family-name:var(--font-active)]">
                <MessageSquare className="w-5 h-5 text-[var(--app-accent)]" />
                <h3 className="font-bold text-base text-[var(--text-heading)] uppercase tracking-tight font-[family-name:var(--font-active)]">
                  Nuevo Chat Directo
                </h3>
              </div>
              <button onClick={() => setShowNewChatModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer font-[family-name:var(--font-active)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewChat} className="space-y-4 font-[family-name:var(--font-active)]">
              <div className="space-y-1.5 font-[family-name:var(--font-active)]">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase block font-[family-name:var(--font-active)]">
                  Rol del Destinatario
                </label>
                <div className="grid grid-cols-2 gap-2 font-[family-name:var(--font-active)]">
                  <button
                    type="button"
                    onClick={() => selectNewChatRole('Organizador')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer font-[family-name:var(--font-active)] ${
                      newChatRole === 'Organizador'
                        ? 'bg-[var(--app-positive-soft)] border-[var(--app-positive)] text-[var(--app-positive)] shadow-sm'
                        : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5 text-[var(--app-positive)]" />
                    Organizador
                  </button>

                  <button
                    type="button"
                    onClick={() => selectNewChatRole('Administrador')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer font-[family-name:var(--font-active)] ${
                      newChatRole === 'Administrador'
                        ? 'bg-[var(--app-danger-soft)] border-[var(--app-danger)] text-[var(--app-danger)] shadow-sm'
                        : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)]'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--app-danger)]" />
                    Administrador
                  </button>

                  <button
                    type="button"
                    onClick={() => selectNewChatRole('Capitan')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer font-[family-name:var(--font-active)] ${
                      newChatRole === 'Capitan'
                        ? 'bg-[var(--app-warning-soft)] border-[var(--app-warning)] text-[var(--app-warning)] shadow-sm'
                        : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5 text-[var(--app-warning)]" />
                    Capitán de Club
                  </button>

                  <button
                    type="button"
                    onClick={() => selectNewChatRole('Jugador')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer font-[family-name:var(--font-active)] ${
                      newChatRole === 'Jugador'
                        ? 'bg-[color-mix(in_srgb,var(--app-accent)_16%,transparent)] border-[var(--app-accent)] text-[var(--app-accent)] shadow-sm'
                        : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-[var(--app-accent)]" />
                    Atleta
                  </button>
                </div>
              </div>

              <div className="space-y-2 font-[family-name:var(--font-active)]">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase block font-[family-name:var(--font-active)]">
                  Seleccionar Usuario ({newChatRole === 'Jugador' ? 'Atleta' : newChatRole})
                </label>

                {/* 🔍 Fast Search Filter Box */}
                <div className="relative font-[family-name:var(--font-active)]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Escribe para buscar por nombre o @gamertag..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full h-9 pl-8 pr-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--app-accent)] font-[family-name:var(--font-active)]"
                  />
                </div>

                {loadingRoleUsers ? (
                  <div className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-active)] py-2.5 px-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--app-accent)]" />
                    <span>Consultando usuarios con rol {newChatRole}...</span>
                  </div>
                ) : filteredRoleUsers.length > 0 ? (
                  <div className="space-y-1.5 font-[family-name:var(--font-active)]">
                    <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-[var(--border-card)] bg-[var(--bg-main)] p-1.5">
                      {filteredRoleUsers.map((u) => {
                        const isSelected = effectiveTargetUserId === u.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setSelectedTargetUserId(u.id)}
                            className={`flex w-full items-center justify-between rounded-lg p-2 text-left transition-all cursor-pointer font-[family-name:var(--font-active)] ${
                              isSelected
                                ? 'border border-[var(--app-accent)] bg-[var(--app-accent-soft)] text-[var(--text-heading)] font-bold shadow-sm'
                                : 'border border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar fallback={u.name} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold leading-tight text-[var(--text-heading)]">
                                  {u.name}
                                </p>
                                <p className="truncate text-[10px] font-bold leading-tight text-[var(--app-accent)]">
                                  @{u.gamertag}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="size-4 text-[var(--app-accent)] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[var(--app-warning-soft)] border border-[var(--app-warning)] text-[var(--app-warning)] text-xs font-[family-name:var(--font-active)]">
                    {userSearchQuery ? `No se encontraron coincidencias para "${userSearchQuery}".` : `No hay usuarios con el rol ${newChatRole} disponibles.`}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 font-[family-name:var(--font-active)]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNewChatModal(false)}
                  className="text-xs font-[family-name:var(--font-active)] cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs font-[family-name:var(--font-active)] font-bold bg-[var(--app-accent)] text-[var(--accent-contrast)] cursor-pointer"
                >
                  Abrir Canal de Chat
                </Button>
              </div>
            </form>
        </Modal>
      )}

      {/* ── BAN MODAL FOR ADMINS & ORGANIZERS ───────────────────────── */}
      {showBanModal && activeThread && (
        <Modal isOpen onClose={() => setShowBanModal(false)} ariaLabel="Sancionar usuario del chat" size="sm" showCloseButton={false} closeDisabled={banningUser} className="p-6 border-[var(--app-danger)] space-y-4 font-[family-name:var(--font-active)]">
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3 font-[family-name:var(--font-active)]">
              <div className="flex items-center gap-2 text-[var(--app-danger)] font-[family-name:var(--font-active)]">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-sm uppercase tracking-tight text-[var(--text-heading)] font-[family-name:var(--font-active)]">
                  Sancionar / Banear Usuario de Chat
                </h3>
              </div>
              <button onClick={() => setShowBanModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer font-[family-name:var(--font-active)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[var(--app-danger-soft)] border border-[var(--app-danger)] text-[var(--app-danger)] text-xs font-[family-name:var(--font-active)]">
              Vas a suspender los privilegios de envío de mensajes para <strong>{activeThread.participantName}</strong>. El usuario no podrá escribir en ningún canal eSports.
            </div>

            <form onSubmit={handleBanTargetUser} className="space-y-4 text-xs font-[family-name:var(--font-active)]">
              <div className="space-y-1.5 font-[family-name:var(--font-active)]">
                <label className="font-bold text-[var(--text-muted)] uppercase block font-[family-name:var(--font-active)]">
                  Motivo Oficial del Baneo / Sanción
                </label>
                <textarea
                  required
                  rows={3}
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  placeholder="Escribe la razón detallada de la sanción..."
                  className="w-full p-3 rounded-[var(--radius-control)] bg-[var(--bg-main)] border border-[var(--border-card)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--app-danger)] font-[family-name:var(--font-active)]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 font-[family-name:var(--font-active)]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowBanModal(false)}
                  className="text-xs font-[family-name:var(--font-active)] cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={banningUser}
                  className="text-xs font-[family-name:var(--font-active)] font-bold bg-[var(--app-danger)] hover:bg-[var(--app-danger)] text-[var(--text-heading)] flex items-center gap-1.5 rounded-[var(--radius-control)] shadow-lg cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  {banningUser ? 'Aplicando Baneo...' : 'Confirmar Baneo Directo'}
                </Button>
              </div>
            </form>
        </Modal>
      )}

      {/* ── REPORT MESSAGE MODAL ───────────────────────── */}
      {reportingMessage && (
        <Modal
          isOpen
          onClose={() => {
            if (!submittingReport) {
              setReportingMessage(null);
              setReportFeedback(null);
            }
          }}
          ariaLabel="Reportar mensaje"
          size="sm"
          showCloseButton={false}
          closeDisabled={submittingReport}
          className="p-6 border-[var(--border-card)] space-y-4 font-[family-name:var(--font-active)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3 font-[family-name:var(--font-active)]">
            <div className="flex items-center gap-2 text-[var(--app-warning)] font-[family-name:var(--font-active)]">
              <Flag className="w-5 h-5 text-[var(--app-warning)]" />
              <h3 className="font-bold text-sm uppercase tracking-tight text-[var(--text-heading)] font-[family-name:var(--font-active)]">
                Reportar Mensaje a Moderación
              </h3>
            </div>
            <button
              onClick={() => {
                if (!submittingReport) {
                  setReportingMessage(null);
                  setReportFeedback(null);
                }
              }}
              disabled={submittingReport}
              className="text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer font-[family-name:var(--font-active)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quoted Message Preview */}
          <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] space-y-1.5 text-xs font-[family-name:var(--font-active)]">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-[family-name:var(--font-active)]">
              <span className="font-bold text-[var(--text-heading)]">{reportingMessage.senderName}</span>
              <span>{reportingMessage.timestamp}</span>
            </div>
            <p className="text-[var(--text-primary)] italic border-l-2 border-[var(--app-accent)] pl-2 py-0.5 line-clamp-3 font-[family-name:var(--font-active)]">
              &quot;{reportingMessage.text}&quot;
            </p>
          </div>

          {reportFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 font-[family-name:var(--font-active)] ${
                reportFeedback.type === 'success'
                  ? 'bg-[var(--app-positive-soft)] text-[var(--app-positive)] border border-[var(--app-positive)]'
                  : 'bg-[var(--app-danger-soft)] text-[var(--app-danger)] border border-[var(--app-danger)]'
              }`}
            >
              {reportFeedback.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 shrink-0" />
              )}
              <span>{reportFeedback.message}</span>
            </div>
          )}

          {(!reportFeedback || reportFeedback.type !== 'success') && (
            <form onSubmit={handleSendReport} className="space-y-4 text-xs font-[family-name:var(--font-active)]">
              <div className="space-y-1.5 font-[family-name:var(--font-active)]">
                <label className="font-bold text-[var(--text-muted)] uppercase block font-[family-name:var(--font-active)]">
                  Motivo de la denuncia
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2.5 rounded-[var(--radius-control)] bg-[var(--bg-main)] border border-[var(--border-card)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--app-accent)] font-[family-name:var(--font-active)]"
                >
                  <option value="Toxicidad / Lenguaje Ofensivo">Toxicidad / Lenguaje Ofensivo</option>
                  <option value="Acoso o Hostigamiento">Acoso o Hostigamiento</option>
                  <option value="Spam o Publicidad no autorizada">Spam o Publicidad no autorizada</option>
                  <option value="Trampas o Arreglo de Partidos">Trampas o Arreglo de Partidos</option>
                  <option value="Conducta Antideportiva">Conducta Antideportiva</option>
                  <option value="Otro motivo">Otro motivo</option>
                </select>
              </div>

              <div className="space-y-1.5 font-[family-name:var(--font-active)]">
                <label className="font-bold text-[var(--text-muted)] uppercase block font-[family-name:var(--font-active)]">
                  Detalles adicionales (opcional)
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Explica qué ocurrió o contexto relevante para los moderadores..."
                  className="w-full p-2.5 rounded-[var(--radius-control)] bg-[var(--bg-main)] border border-[var(--border-card)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--app-accent)] font-[family-name:var(--font-active)]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 font-[family-name:var(--font-active)]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setReportingMessage(null);
                    setReportFeedback(null);
                  }}
                  disabled={submittingReport}
                  className="text-xs font-[family-name:var(--font-active)] cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submittingReport}
                  className="text-xs font-[family-name:var(--font-active)] font-bold bg-[var(--app-warning)] hover:bg-[var(--app-warning)] text-[var(--accent-contrast)] flex items-center gap-1.5 rounded-[var(--radius-control)] shadow-lg cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  {submittingReport ? 'Enviando Reporte...' : 'Enviar Reporte'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
