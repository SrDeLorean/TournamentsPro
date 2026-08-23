'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getChatThreadsAction,
  getThreadMessagesAction,
  sendChatMessageAction,
  createOrGetDirectThreadAction,
  getUsersByRoleAction,
  banUserFromChatAction,
  unbanUserFromChatAction,
  checkUserBanStatusAction,
  updateTypingStatusAction,
  clearTypingStatusAction,
  getTypingUsersAction,
} from '@/app/actions/chat';
import {
  MessageSquare,
  Send,
  ShieldCheck,
  User,
  Trophy,
  CheckCheck,
  Sparkles,
  X,
  Plus,
  Lock,
  LogIn,
  UserPlus,
  Crown,
  Search,
  RefreshCw,
  Megaphone,
  ShieldAlert,
  Users,
  Ban,
  ShieldBan,
} from 'lucide-react';

import { useSearchParams } from 'next/navigation';

interface ChatSystemProps {
  activeConvId?: string;
  initialTopic?: string;
  onClose?: () => void;
}

export function ChatSystem({ activeConvId, initialTopic, onClose }: ChatSystemProps) {
  const { currentUser, activeGameSlug } = useAuth();
  const currentGameSlug = activeGameSlug || 'eafc26';
  const searchParams = useSearchParams();

  const urlTargetUserId = searchParams.get('targetUserId');
  const urlTargetUserName = searchParams.get('targetUserName');
  const urlTargetUserRole = searchParams.get('targetUserRole');
  const urlTopic = searchParams.get('topic');

  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>(activeConvId || '');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'DIRECTO' | 'SOPORTE_ORGANIZADOR' | 'ANUNCIO_ADMIN'>('ALL');
  const [messages, setMessages] = useState<any[]>([]);
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
  const [availableUsersForRole, setAvailableUsersForRole] = useState<any[]>([]);
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<string>('');
  const [loadingRoleUsers, setLoadingRoleUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Fetch users matching selected role whenever modal opens or role changes
  useEffect(() => {
    if (showNewChatModal) {
      setLoadingRoleUsers(true);
      setUserSearchQuery('');
      getUsersByRoleAction(newChatRole)
        .then((res) => {
          if (res.success && res.data && res.data.length > 0) {
            setAvailableUsersForRole(res.data);
            setSelectedTargetUserId(res.data[0].id);
          } else {
            setAvailableUsersForRole([]);
            setSelectedTargetUserId('');
          }
        })
        .finally(() => setLoadingRoleUsers(false));
    }
  }, [newChatRole, showNewChatModal]);

  const filteredRoleUsers = availableUsersForRole.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.gamertag.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (filteredRoleUsers.length > 0) {
      if (!selectedTargetUserId || !filteredRoleUsers.some((u) => u.id === selectedTargetUserId)) {
        setSelectedTargetUserId(filteredRoleUsers[0].id);
      }
    }
  }, [userSearchQuery, availableUsersForRole]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load threads from MySQL DB
  const loadThreads = () => {
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
  };

  useEffect(() => {
    loadThreads();
  }, [currentUser?.id, currentGameSlug, channelFilter]);

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
        if (res.success && res.threadId) {
          setSelectedThreadId(res.threadId);
          loadThreads();
          if (urlTopic) {
            setInputMessage(`Hola ${targetName}, vi tu anuncio sobre "${urlTopic}" en el Mercado de Traspasos y me interesa conversar.`);
          }
        }
      });
    }
  }, [currentUser?.id, urlTargetUserId, urlTargetUserName, urlTargetUserRole, urlTopic, currentGameSlug]);

  // Load messages for selected thread
  const loadMessages = (threadId: string) => {
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
  };

  useEffect(() => {
    if (selectedThreadId) {
      loadMessages(selectedThreadId);
    }
  }, [selectedThreadId]);

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
  }, [selectedThreadId, currentUser]);

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
        alert(res.error || 'Error al banear usuario.');
      }
    } finally {
      setBanningUser(false);
    }
  };

  const handleUnbanTargetUser = async () => {
    if (!activeThread?.participantId) return;
    const res = await unbanUserFromChatAction(activeThread.participantId);
    if (res.success) {
      setActionNotification(`La sanción para ${activeThread.participantName} ha sido levantada.`);
      loadThreads();
    }
  };

  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const targetUserObj = filteredRoleUsers.find((u) => u.id === selectedTargetUserId) || filteredRoleUsers[0] || availableUsersForRole[0];

    const targetId = targetUserObj?.id || (
      newChatRole === 'Organizador'
        ? 'usr-organizer'
        : newChatRole === 'Administrador'
        ? 'usr-admin'
        : `usr-direct-${Date.now()}`
    );

    const targetName = targetUserObj?.name || (
      newChatRole === 'Organizador'
        ? 'Organizador Oficial'
        : newChatRole === 'Administrador'
        ? 'Administrador Principal'
        : 'Atleta eSports'
    );

    const channelTypeVal =
      newChatRole === 'Organizador'
        ? 'SOPORTE_ORGANIZADOR'
        : newChatRole === 'Administrador'
        ? 'ANUNCIO_ADMIN'
        : 'DIRECTO';

    const res = await createOrGetDirectThreadAction(
      currentUser.id,
      currentUser.name || 'Tú',
      currentUser.role || 'Jugador',
      targetId,
      targetName,
      targetUserObj?.role || newChatRole,
      currentGameSlug,
      channelTypeVal,
      `Chat con ${targetName}`
    );

    if (res.success && res.threadId) {
      setSelectedThreadId(res.threadId);
      setShowNewChatModal(false);
      loadThreads();
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
        return <ShieldCheck className="w-3 h-3 text-rose-400" />;
      case 'Organizador':
        return <Trophy className="w-3 h-3 text-emerald-400" />;
      case 'Capitán':
      case 'Capitan':
        return <Crown className="w-3 h-3 text-amber-400" />;
      default:
        return <User className="w-3 h-3 text-cyan-400" />;
    }
  };

  if (!currentUser) {
    return (
      <Card className="p-8 text-center space-y-5 max-w-lg mx-auto bg-[var(--bg-card)] border-[var(--border-card)] rounded-3xl shadow-2xl font-mono">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-[var(--text-heading)] uppercase">
            Autenticación Requerida
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Inicia sesión con tu cuenta para acceder a la mensajería interna eSports, contactar capitanes de equipos y comunicarte con organizadores.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link href="/login" className="w-full">
            <Button className="w-full text-xs font-mono font-bold bg-[var(--accent-cyan)] text-slate-950 hover:brightness-110 flex items-center justify-center gap-1.5">
              <LogIn className="w-4 h-4" />
              Iniciar Sesión
            </Button>
          </Link>
          <Link href="/registro" className="w-full">
            <Button variant="outline" className="w-full text-xs font-mono border-[var(--border-card)] flex items-center justify-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              Crear Cuenta
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full h-[700px] glass-panel border border-[var(--border-card)] rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 text-[var(--text-primary)]">
      
      {/* 📁 LEFT SIDEBAR: Channels & Contacts */}
      <div className="md:col-span-4 border-r border-[var(--border-card)] bg-[var(--bg-card)] flex flex-col justify-between">
        <div className="p-4 border-b border-[var(--border-card)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[var(--accent-cyan)]" />
              <h3 className="font-extrabold text-sm uppercase tracking-tight text-[var(--text-heading)]">
                Mensajería eSports
              </h3>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-1.5 rounded-xl bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 transition-all text-xs font-bold flex items-center gap-1"
                title="Nuevo Chat Directo"
              >
                <Plus className="w-4 h-4" />
              </button>
              {onClose && (
                <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search Contacts */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar atletas, capitanes, organizadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)]"
            />
          </div>

          {/* 🏷️ Role Channel Filter Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[var(--bg-main)]/60 rounded-xl border border-[var(--border-card)] text-[10px] font-mono font-bold">
            <button
              onClick={() => setChannelFilter('ALL')}
              className={`py-1 rounded-lg transition-all ${
                channelFilter === 'ALL'
                  ? 'bg-[var(--accent-cyan)] text-slate-950 font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              TODOS
            </button>
            <button
              onClick={() => setChannelFilter('DIRECTO')}
              className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
                channelFilter === 'DIRECTO'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              DIRECTO
            </button>
            <button
              onClick={() => setChannelFilter('SOPORTE_ORGANIZADOR')}
              className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
                channelFilter === 'SOPORTE_ORGANIZADOR'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <Trophy className="w-3 h-3" />
              ORGS
            </button>
            <button
              onClick={() => setChannelFilter('ANUNCIO_ADMIN')}
              className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
                channelFilter === 'ANUNCIO_ADMIN'
                  ? 'bg-rose-500 text-slate-950 font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              ADMIN
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-card)]">
          {loadingThreads ? (
            <div className="py-12 text-center text-xs font-mono text-[var(--text-muted)] flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[var(--accent-cyan)]" />
              <span>Cargando canales eSports...</span>
            </div>
          ) : filteredThreads.length > 0 ? (
            filteredThreads.map((thread) => {
              const isSelected = thread.id === selectedThreadId;
              return (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`w-full p-3.5 text-left flex items-start gap-3 transition-all ${
                    isSelected
                      ? 'bg-[var(--accent-cyan-bg)] border-l-4 border-[var(--accent-cyan)]'
                      : 'hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  <Avatar fallback={thread.participantName} status="online" size="md" />

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-[var(--text-heading)] truncate flex items-center gap-1">
                        {getRoleIcon(thread.participantRole)}
                        <span className="truncate">{thread.title}</span>
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">{thread.lastMessageAt}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant={getRoleBadgeVariant(thread.participantRole)} className="text-[9px] px-1.5 py-0 font-mono">
                        {thread.participantRole}
                      </Badge>
                      {thread.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-[var(--accent-cyan)] text-slate-950 font-extrabold text-[10px] flex items-center justify-center">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[var(--text-muted)] truncate font-mono">
                      {thread.lastMessageText}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs font-mono text-[var(--text-muted)] space-y-2 p-4">
              <MessageSquare className="w-8 h-8 mx-auto opacity-40 text-[var(--accent-cyan)]" />
              <p>No se encontraron conversaciones activas en esta categoría.</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-[var(--border-card)] bg-[var(--bg-main)] text-[10px] text-[var(--text-muted)] font-mono text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Chat en Vivo Auditado | TournamentsPro eSports</span>
        </div>
      </div>

      {/* 💬 RIGHT DISPLAY: Active Chat Messages */}
      <div className="md:col-span-8 flex flex-col justify-between bg-[var(--bg-main)]">
        {activeThread ? (
          <>
            {/* Header of Active Conversation */}
            <div className="p-4 border-b border-[var(--border-card)] bg-[var(--bg-card)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar fallback={activeThread.participantName} status="online" size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-[var(--text-heading)] uppercase flex items-center gap-1.5">
                      {getRoleIcon(activeThread.participantRole)}
                      <span>{activeThread.title}</span>
                    </h4>
                    <Badge variant={getRoleBadgeVariant(activeThread.participantRole)} className="text-[10px] font-mono">
                      {activeThread.participantRole}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    Contacto: {activeThread.participantName} | Canal eSports MySQL
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono">
                {canBanOthers && activeThread && activeThread.participantId !== 'usr-all' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowBanModal(true)}
                    className="text-[11px] font-mono border-rose-500/40 text-rose-400 hover:bg-rose-950/80 flex items-center gap-1 h-8 rounded-xl"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Banear Usuario
                  </Button>
                )}
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  En Línea
                </span>
              </div>
            </div>

            {/* Messages Display Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono">
              {loadingMessages && messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent-cyan)]" />
                  <span>Cargando historial de mensajes...</span>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  const senderRoleVariant = getRoleBadgeVariant(msg.senderRole);

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[var(--text-muted)] font-bold">
                        <span>{msg.senderName}</span>
                        <Badge variant={senderRoleVariant} className="text-[8px] px-1 py-0">
                          {msg.senderRole}
                        </Badge>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                          isMe
                            ? 'bg-[var(--accent-cyan)] text-slate-950 rounded-br-none font-bold'
                            : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-heading)] rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center text-xs text-[var(--text-muted)] space-y-2">
                  <Sparkles className="w-8 h-8 text-[var(--accent-cyan)] mx-auto opacity-50" />
                  <p className="font-bold">Inicia la conversación</p>
                  <p>Envía tu primer mensaje para acordar fichajes o realizar consultas de torneo.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Message Form OR Ban Guard Banner */}
            {userBanInfo.isBanned ? (
              <div className="p-3.5 border-t border-rose-500/40 bg-rose-950/80 text-rose-300 font-mono text-xs flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 animate-pulse" />
                <div>
                  <strong className="block text-white font-bold uppercase text-[11px]">
                    🚫 CUENTA SANCIONADA Y BANEADA DEL CHAT ESPORTS
                  </strong>
                  <p className="text-[10px] text-rose-200">
                    Has sido sancionado por la administración y tus privilegios de envío de mensajes se encuentran suspendidos. Motivo: "{userBanInfo.reason || 'Infracción de reglamento eSports.'}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-t border-[var(--border-card)] bg-[var(--bg-card)]">
                {/* INDICADOR DE USUARIO ESCRIBIENDO */}
                {typingUsers.length > 0 && (
                  <div className="px-4 py-2 bg-cyan-950/60 border-b border-cyan-500/30 text-cyan-300 font-mono text-[11px] flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                      </span>
                      <span className="font-bold text-cyan-200">
                        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'está escribiendo' : 'están escribiendo'}...
                      </span>
                    </div>
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="p-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={handleInputChange}
                    placeholder={`Escribir mensaje a ${activeThread.participantName}...`}
                    className="flex-1 h-10 px-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)]"
                  />
                  <Button
                    type="submit"
                    disabled={sending || !inputMessage.trim()}
                    className="h-10 px-4 font-mono font-bold text-xs bg-[var(--accent-cyan)] text-slate-950 hover:brightness-110 flex items-center gap-1.5 rounded-xl shadow-md"
                  >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? 'Enviando...' : 'Enviar'}
                </Button>
              </form>
            </div>
          )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)] space-y-3 font-mono">
            <MessageSquare className="w-12 h-12 text-[var(--accent-cyan)] opacity-50 mx-auto" />
            <h4 className="text-base font-bold text-[var(--text-heading)]">Selecciona o Inicia una Conversación</h4>
            <p className="text-xs max-w-sm">
              Conecta directamente con Atletas, Capitanes de Equipos o la Mesa de Organizadores eSports.
            </p>
            <Button
              size="sm"
              onClick={() => setShowNewChatModal(true)}
              className="text-xs font-mono font-bold bg-[var(--accent-cyan)] text-slate-950"
            >
              + Iniciar Nuevo Chat
            </Button>
          </div>
        )}
      </div>

      {/* ── NEW CHAT MODAL ────────────────────────────────────────────── */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 shadow-2xl space-y-5 text-[var(--text-primary)] relative">
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[var(--accent-cyan)]" />
                <h3 className="font-bold text-base text-[var(--text-heading)] uppercase tracking-tight font-mono">
                  Nuevo Chat Directo
                </h3>
              </div>
              <button onClick={() => setShowNewChatModal(false)} className="text-[var(--text-muted)] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewChat} className="space-y-4 font-mono">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase block">
                  Rol del Destinatario
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewChatRole('Organizador')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      newChatRole === 'Organizador'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                    Organizador
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewChatRole('Administrador')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      newChatRole === 'Administrador'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)]'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                    Administrador
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewChatRole('Capitan')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      newChatRole === 'Capitan'
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Capitán de Club
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewChatRole('Jugador')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      newChatRole === 'Jugador'
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                        : 'bg-[var(--bg-main)] border-[var(--border-card)] text-[var(--text-muted)]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    Atleta
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase block">
                  Seleccionar Usuario ({newChatRole === 'Jugador' ? 'Atleta' : newChatRole})
                </label>

                {/* 🔍 Fast Search Filter Box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Escribe para buscar por nombre o @gamertag..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full h-9 pl-8 pr-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] font-mono"
                  />
                </div>

                {loadingRoleUsers ? (
                  <div className="text-xs text-[var(--text-muted)] font-mono py-2.5 px-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--accent-cyan)]" />
                    <span>Consultando usuarios con rol {newChatRole} en MySQL...</span>
                  </div>
                ) : filteredRoleUsers.length > 0 ? (
                  <select
                    value={selectedTargetUserId}
                    onChange={(e) => setSelectedTargetUserId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-cyan)] cursor-pointer font-mono"
                  >
                    {filteredRoleUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (@{u.gamertag})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-mono">
                    {userSearchQuery ? `No se encontraron coincidencias para "${userSearchQuery}".` : `No hay usuarios con el rol ${newChatRole} en la BD.`}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNewChatModal(false)}
                  className="text-xs font-mono"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="text-xs font-mono font-bold bg-[var(--accent-cyan)] text-slate-950"
                >
                  Abrir Canal de Chat
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── BAN MODAL FOR ADMINS & ORGANIZERS ───────────────────────── */}
      {showBanModal && activeThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-sm uppercase tracking-tight text-white">
                  Sancionar / Banear Usuario de Chat
                </h3>
              </div>
              <button onClick={() => setShowBanModal(false)} className="text-[var(--text-muted)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs">
              Vas a suspender los privilegios de envío de mensajes para <strong>{activeThread.participantName}</strong>. El usuario no podrá escribir en ningún canal eSports.
            </div>

            <form onSubmit={handleBanTargetUser} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[var(--text-muted)] uppercase block">
                  Motivo Oficial del Baneo / Sanción
                </label>
                <textarea
                  required
                  rows={3}
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  placeholder="Escribe la razón detallada de la sanción..."
                  className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowBanModal(false)}
                  className="text-xs font-mono"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={banningUser}
                  className="text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 rounded-xl shadow-lg"
                >
                  <Ban className="w-4 h-4" />
                  {banningUser ? 'Aplicando Baneo...' : 'Confirmar Baneo Directo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
