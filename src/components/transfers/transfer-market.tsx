'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TransferListing } from '@/lib/data-store';
import { GAMES_CATALOG, GameConfig } from '@/lib/games-data';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/ui/filter-bar';
import { GameExplorerPanel } from '@/components/ui/game-explorer-panel';
import { PageHeader } from '@/components/ui/page-header';
import { EsportsCard } from '@/components/ui/esports-card';
import { Modal } from '@/components/ui/modal';
import {
  createTransferPostAction,
  getTransferPostsAction,
  getCompletedTransfersAction,
  getGameConfigurationAction,
} from '@/app/actions/transfers';
import {
  ArrowRightLeft,
  UserCheck,
  Shield,
  Plus,
  Clock,
  AlertCircle,
  Lock,
  LogIn,
  UserPlus,
  Calendar,
  Trophy,
  X,
  Database,
} from 'lucide-react';

import { TacticalLoadingSkeleton } from '@/components/tournaments/tactical-loading-skeleton';
import { useAuth } from '@/components/providers/auth-provider';

interface TransferMarketProps {
  game?: GameConfig;
}

type MarketTab = 'ALL' | 'JUGADOR_BUSCA_CLUB' | 'CLUB_RECLUTA_JUGADOR' | 'REALIZADOS';
type TimeFilter = 'ALL' | 'TODAY' | '3_DAYS' | '7_DAYS' | 'OLDEST';

interface CompletedTransfer {
  id: string;
  playerName: string;
  playerGamertag: string;
  fromTeamName: string;
  toTeamName: string;
  transferType: string;
  signedAt: string;
}

interface LegacyTeamFields {
  team?: string;
  team_id?: string;
}

export function TransferMarket({ game }: TransferMarketProps) {
  const { activeGameSlug, currentUser } = useAuth();
  const currentGameSlug = game?.slug || activeGameSlug || 'eafc26';
  const currentGameObj = GAMES_CATALOG[currentGameSlug] || GAMES_CATALOG['eafc26'];

  // Dynamic Game Configuration Loaded directly from MySQL Database
  const [dbGameConfig, setDbGameConfig] = useState<{
    maxSquadCap: number;
    maxTransfersPerWindow: number;
    postExpirationDays: number;
    positions: string[];
  }>({
    maxSquadCap: currentGameSlug === 'eafc26' ? 20 : 7,
    maxTransfersPerWindow: 3,
    postExpirationDays: 7,
    positions: currentGameObj?.positions || ['MCO', 'DFC', 'LD', 'LI', 'MCD', 'MC', 'DC'],
  });

  useEffect(() => {
    getGameConfigurationAction(currentGameSlug).then((res) => {
      if (res.success && res.data) {
        setDbGameConfig({
          maxSquadCap: res.data.maxSquadCap,
          maxTransfersPerWindow: res.data.maxTransfersPerWindow,
          postExpirationDays: res.data.postExpirationDays,
          positions: res.data.positions,
        });
      }
    });
  }, [currentGameSlug]);

  const [activeTab, setActiveTab] = useState<MarketTab>('ALL');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoadingDB, setIsLoadingDB] = useState(true);

  // Form State for creating a new Transfer Listing
  const [listingType, setListingType] = useState<'JUGADOR_BUSCA_CLUB' | 'CLUB_RECLUTA_JUGADOR'>('JUGADOR_BUSCA_CLUB');
  const [positionInput, setPositionInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [platformInput, setPlatformInput] = useState('CROSSPLAY');
  const [submitting, setSubmitting] = useState(false);

  const openCreateModal = () => {
    const nextPosition = dbGameConfig.positions.includes(positionInput)
      ? positionInput
      : dbGameConfig.positions[0] || '';
    setPositionInput(nextPosition);
    setShowCreateModal(true);
  };

  const [transfers, setTransfers] = useState<TransferListing[]>([]);
  const [completedTransfers, setCompletedTransfers] = useState<CompletedTransfer[]>([]);

  // Function to reload active listings from DB
  const loadActiveListings = useCallback(() => {
    const apiTimeFilter = timeFilter === 'OLDEST' ? 'ALL' : timeFilter;
    getTransferPostsAction(currentGameSlug, apiTimeFilter)
      .then((res) => {
        if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mappedDbPosts: TransferListing[] = res.data.map((p) => ({
            id: p.id,
            type: p.type as TransferListing['type'],
            userId: p.userId,
            userName: p.userName,
            userGamertag: p.userGamertag,
            teamName: p.teamName || undefined,
            gameSlug: p.gameSlug as TransferListing['gameSlug'],
            position: p.position,
            platform: p.platform,
            status: p.status === 'ACTIVO' ? 'DISPONIBLE' : p.status as TransferListing['status'],
            date: new Date(p.createdAt).toLocaleDateString(),
            message: p.message,
          }));
          setTransfers(mappedDbPosts);
        } else {
          setTransfers([]);
        }
      })
      .catch((err) => {
        console.error('Error al cargar publicaciones de BD:', err);
      })
      .finally(() => setIsLoadingDB(false));
  }, [currentGameSlug, timeFilter]);

  // Function to load completed historic transfers
  const loadCompletedTransfers = useCallback(() => {
    setIsLoadingDB(true);
    getCompletedTransfersAction(currentGameSlug)
      .then((res) => {
        if (res.success && res.data) {
          setCompletedTransfers(res.data as CompletedTransfer[]);
        } else {
          setCompletedTransfers([]);
        }
      })
      .catch((err) => {
        console.error('Error al cargar traspasos realizados:', err);
        setCompletedTransfers([]);
      })
      .finally(() => setIsLoadingDB(false));
  }, [currentGameSlug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (activeTab === 'REALIZADOS') {
        loadCompletedTransfers();
      } else {
        loadActiveListings();
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeTab, loadActiveListings, loadCompletedTransfers]);

  let filteredTransfers = transfers.filter((item) => {
    const matchesGame = item.gameSlug === currentGameSlug;
    const matchesTab = activeTab === 'ALL' || item.type === activeTab;
    const matchesSearch =
      item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userGamertag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.teamName && item.teamName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesGame && matchesTab && matchesSearch;
  });

  if (timeFilter === 'OLDEST') {
    filteredTransfers = [...filteredTransfers].reverse();
  }

  let filteredCompletedTransfers = completedTransfers.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      item.playerName.toLowerCase().includes(search) ||
      item.playerGamertag.toLowerCase().includes(search) ||
      item.fromTeamName.toLowerCase().includes(search) ||
      item.toTeamName.toLowerCase().includes(search)
    );
  });

  if (timeFilter === 'OLDEST') {
    filteredCompletedTransfers = [...filteredCompletedTransfers].reverse();
  }

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!positionInput.trim() || !messageInput.trim()) return;

    setSubmitting(true);
    try {
      const legacyUser = currentUser as typeof currentUser & LegacyTeamFields;
      const teamNameVal = listingType === 'CLUB_RECLUTA_JUGADOR' ? currentUser.teamName || legacyUser.team || 'Escuadra Oficial' : undefined;
      const teamIdVal = listingType === 'CLUB_RECLUTA_JUGADOR' ? currentUser.teamId || legacyUser.team_id : undefined;

      // 1. Optimistic UI update: Immediately insert new listing into local state
      const newListing: TransferListing = {
        id: `tmp-${Date.now()}`,
        type: listingType,
        userName: currentUser.name || 'Atleta Oficial',
        userGamertag: currentUser.gamertag || 'Gamertag',
        teamName: teamNameVal,
        gameSlug: currentGameSlug as TransferListing['gameSlug'],
        position: positionInput.trim(),
        platform: platformInput,
        status: 'DISPONIBLE',
        date: new Date().toLocaleDateString(),
        message: messageInput.trim(),
      };

      setTransfers((prev) => [
        newListing,
        ...prev.filter((p) => !(p.userGamertag === currentUser.gamertag && p.type === listingType)),
      ]);

      // Switch active tab and reset time filter to ensure new post is visible
      setActiveTab(listingType);
      setTimeFilter('ALL');

      // 2. Persist to MySQL database with 7-day expiration rule & auto-replace previous active post
      await createTransferPostAction({
        gameSlug: currentGameSlug,
        type: listingType,
        userId: currentUser.id,
        userName: currentUser.name || 'Atleta Oficial',
        userGamertag: currentUser.gamertag || 'Gamertag',
        teamId: teamIdVal,
        teamName: teamNameVal,
        position: positionInput.trim(),
        platform: platformInput,
        message: messageInput.trim(),
      });

      setShowCreateModal(false);
      setPositionInput('');
      setMessageInput('');

      // 🔄 RELOAD FROM DATABASE
      loadActiveListings();
    } catch (err) {
      console.error('Error al publicar anuncio:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const legacyUser = currentUser as (typeof currentUser & LegacyTeamFields) | null;
  const currentRole = currentUser?.role as string | undefined;
  const hasTeam = Boolean(currentUser?.teamId || legacyUser?.team || ['Capitán', 'DT', 'Manager', 'Administrador'].includes(currentRole || ''));

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* 🚀 Top Control Strip & Page Header */}
      <div className="space-y-4">
        <PageHeader
          badgeText="MERCADO DE TRASPASOS"
          badgeIcon={
            <ArrowRightLeft
              className="w-3.5 h-3.5"
              style={{ color: currentGameObj.brandColor, fill: currentGameObj.brandColor }}
            />
          }
          title="Agencia Libre & Fichajes"
          highlightTitle="Transferencias"
          description={`Conecta directamente atletas disponibles y escuadras en búsqueda de fichajes para competir al más alto nivel en ${currentGameObj.name}.`}
          brandColor={currentGameObj.brandColor}
        />

        {/* Squad Cap Rule & Expiry Banner - Loaded Dynamically from MySQL */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-[var(--text-heading)] uppercase block flex items-center gap-1.5">
                Reglamento de Plantilla MySQL ({currentGameObj.name})
              </span>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">
                Capacidad máxima BD: <strong className="text-cyan-400">{dbGameConfig.maxSquadCap} Atletas</strong>. Máx. fichajes/temporada: <strong className="text-amber-400">{dbGameConfig.maxTransfersPerWindow}</strong>. Expiración BD: <strong>{dbGameConfig.postExpirationDays} días</strong>.
              </p>
            </div>
          </div>

          <Button
            onClick={openCreateModal}
            className="font-bold text-xs shrink-0 rounded-xl shadow-md flex items-center gap-1.5"
            style={{
              backgroundColor: currentGameObj.brandColor,
              color: '#020617',
              boxShadow: `0 0 15px color-mix(in srgb, ${currentGameObj.brandColor} 30%, transparent)`,
            }}
          >
            <Plus className="w-4 h-4" />
            Publicar en Mercado
          </Button>
        </div>
      </div>

      {/* ── BARRA DE FILTROS UNIFICADA CON SELECTORES ─────────────────────────── */}
      <GameExplorerPanel
        title="Explorar el mercado"
        description="Busca atletas, vacantes y fichajes; combina tipo de publicación y antigüedad."
        brandColor={currentGameObj.brandColor}
        icon={<ArrowRightLeft className="size-4" />}
        onReset={() => {
          setSearchTerm('');
          setActiveTab('ALL');
          setTimeFilter('ALL');
        }}
        resetDisabled={!searchTerm && activeTab === 'ALL' && timeFilter === 'ALL'}
      >
        <FilterBar
          searchPlaceholder="Buscar por posición, gamertag o nombre de club..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          options={[
            { id: 'ALL', label: 'TODAS LAS PUBLICACIONES' },
            { id: 'JUGADOR_BUSCA_CLUB', label: '🏃 AGENCIA LIBRE (ATLETAS)' },
            { id: 'CLUB_RECLUTA_JUGADOR', label: '🛡️ RECLUTAMIENTO (CLUBES)' },
            { id: 'REALIZADOS', label: '🏆 TRASPASOS REALIZADOS' },
          ]}
          activeFilter={activeTab}
          onFilterChange={(fId) => setActiveTab(fId as MarketTab)}
          renderAsSelect={true}
          count={activeTab === 'REALIZADOS' ? filteredCompletedTransfers.length : filteredTransfers.length}
          countLabel={activeTab === 'REALIZADOS' ? 'FICHADOS' : 'PUBLICACIONES ACTIVAS'}
          brandColor={currentGameObj.brandColor}
        >
          <label className="game-filter-inline-select">
            <Calendar className="w-4 h-4 shrink-0" style={{ color: currentGameObj.brandColor }} />
            <span>Antigüedad</span>
            <select
              aria-label="Filtrar publicaciones por antigüedad"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="ui-control min-w-0 flex-1 px-3 text-xs font-bold text-[var(--text-heading)] lg:w-52"
              style={{
                borderColor: `color-mix(in srgb, ${currentGameObj.brandColor} 40%, var(--border-card))`,
              }}
            >
              <option value="ALL">Todos ({dbGameConfig.postExpirationDays} días)</option>
              <option value="TODAY">Hoy (últimas 24 h)</option>
              <option value="3_DAYS">Últimos 3 días</option>
              <option value="7_DAYS">Últimos {dbGameConfig.postExpirationDays} días</option>
              <option value="OLDEST">Más antiguos primero</option>
            </select>
          </label>
        </FilterBar>
      </GameExplorerPanel>

      {/* 🏆 TRASPASOS REALIZADOS SECTION */}
      {activeTab === 'REALIZADOS' ? (
        isLoadingDB ? (
          <div className="py-8">
            <TacticalLoadingSkeleton
              game={currentGameObj}
              message={`CARGANDO HISTORIAL DE TRASPASOS REALIZADOS PARA ${currentGameObj.name}...`}
            />
          </div>
        ) : (
          <div className="game-directory-grid">
            {filteredCompletedTransfers.map((item, index) => (
              <EsportsCard
                key={item.id}
                entityType="user"
                href="#"
                title={`${item.playerName} (@${item.playerGamertag})`}
                subtitle={`🎮 ${currentGameObj.name}`}
                description={`Fichaje confirmado: El atleta fue incorporado exitosamente a la plantilla de ${item.toTeamName}.`}
                tag={item.transferType}
                badges={[
                  {
                    text: 'FICHAJE EXITOSO',
                    variant: 'emerald',
                  },
                ]}
                stats={[
                  { icon: <Shield className="w-3.5 h-3.5 text-amber-400" />, label: 'Origen', value: item.fromTeamName },
                  { icon: <Shield className="w-3.5 h-3.5 text-emerald-400" />, label: 'Destino', value: item.toTeamName },
                ]}
                footerLeft={
                  <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] font-mono">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{new Date(item.signedAt).toLocaleDateString()}</span>
                  </span>
                }
                actionText="VER MOVIMIENTO AUDITADO"
                brandColor={currentGameObj.brandColor}
                animationDelay={index * 50}
              />
            ))}

            {filteredCompletedTransfers.length === 0 && (
              <div className="col-span-full py-16 text-center border border-dashed border-[var(--border-card)] rounded-3xl bg-[var(--bg-card)]/40 space-y-3 font-mono">
                <Trophy className="w-12 h-12 text-amber-400 mx-auto opacity-50" />
                <h3 className="text-lg font-bold text-[var(--text-heading)]">No hay registros de traspasos completados</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                  Los fichajes aprobados oficialmente por organizadores y capitanes aparecerán aquí en tiempo real.
                </p>
              </div>
            )}
          </div>
        )
      ) : (
        /* 🚀 ACTIVE MARKET LISTINGS GRID */
        isLoadingDB && transfers.length === 0 ? (
          <div className="py-8">
            <TacticalLoadingSkeleton
              game={currentGameObj}
              message={`CONSULTANDO PUBLICACIONES DE BD PARA ${currentGameObj.name}...`}
            />
          </div>
        ) : (
          <div className="game-directory-grid">
            {filteredTransfers.map((item, index) => {
              const isPlayerListing = item.type === 'JUGADOR_BUSCA_CLUB';
              const targetRole = isPlayerListing ? 'Jugador' : 'Capitán';
              const targetId = item.userId || 'usr-player-1';
              const topicStr = `${item.position} (${isPlayerListing ? 'Agente Libre' : 'Reclutamiento Club'})`;
              const chatHref = `/mensajes?targetUserId=${encodeURIComponent(targetId)}&targetUserName=${encodeURIComponent(item.userName)}&targetUserRole=${encodeURIComponent(targetRole)}&topic=${encodeURIComponent(topicStr)}`;

              return (
                <EsportsCard
                  key={item.id}
                  entityType={isPlayerListing ? 'user' : 'team'}
                  href={chatHref}
                  title={isPlayerListing ? item.userName : item.teamName || item.userName}
                  subtitle={`🎮 ${currentGameObj.name} | 🖥️ ${item.platform}`}
                  description={`"${item.message}"`}
                  tag={item.position}
                  badges={[
                    {
                      text: isPlayerListing ? 'ATLETA BUSCA CLUB' : 'CLUB RECLUTA',
                      variant: isPlayerListing ? 'amber' : 'purple',
                      pulse: true,
                    },
                    {
                      text: `VÁLIDO ${dbGameConfig.postExpirationDays} DÍAS`,
                      variant: 'cyan',
                    },
                  ]}
                  stats={[
                    { icon: <UserCheck className="w-3.5 h-3.5 text-cyan-400" />, label: 'Gamertag', value: `@${item.userGamertag}` },
                    { icon: <Clock className="w-3.5 h-3.5 text-amber-400" />, label: 'Publicado', value: item.date },
                  ]}
                  footerLeft={
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isPlayerListing ? 'Agente Libre' : 'Club Registrado'}</span>
                    </span>
                  }
                  actionText="CONTACTAR Y HABLAR EN CHAT"
                  brandColor={currentGameObj.brandColor}
                  animationDelay={index * 50}
                />
              );
            })}

            {filteredTransfers.length === 0 && (
              <div className="col-span-full py-16 text-center border border-dashed border-[var(--border-card)] rounded-3xl bg-[var(--bg-card)]/40 space-y-3">
                <ArrowRightLeft className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-50" />
                <h3 className="text-lg font-bold text-[var(--text-heading)]">No se encontraron ofertas activas en la BD</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto font-mono">
                  Sé el primero en publicar una vacante de club o tu perfil de agente libre en {currentGameObj.name}.
                </p>
                <Button
                  size="sm"
                  onClick={openCreateModal}
                  className="text-xs font-mono font-bold"
                  style={{ backgroundColor: currentGameObj.brandColor, color: '#020617' }}
                >
                  Publicar Anuncio Ahora
                </Button>
              </div>
            )}
          </div>
        )
      )}

      {/* ── CREATE LISTING MODAL WITH DYNAMIC BD POSITIONS & AUTH CHECK ────────────────────────── */}
      {showCreateModal && (
        <Modal isOpen onClose={() => setShowCreateModal(false)} ariaLabel="Publicar en mercado de traspasos" size="md" showCloseButton={false} closeDisabled={submitting} className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-4">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" style={{ color: currentGameObj.brandColor }} />
                <h3 className="font-bold text-base text-[var(--text-heading)] uppercase tracking-tight">
                  Publicar en Mercado de Traspasos
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* IF NOT LOGGED IN: SHOW AUTH ALERT */}
            {!currentUser ? (
              <div className="py-6 text-center space-y-5 font-mono">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-lg font-bold text-[var(--text-heading)]">
                    Autenticación Requerida
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
                    Debes iniciar sesión con tu cuenta de atleta para publicar tu disponibilidad en Agencia Libre o solicitar fichajes a nombre de tu escuadra.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link href="/login" className="w-full">
                    <Button className="w-full text-xs font-mono font-bold bg-[var(--game-brand)] text-slate-950 hover:brightness-110 flex items-center justify-center gap-1.5">
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
              </div>
            ) : (
              /* LOGGED IN FORM */
              <form onSubmit={handleCreateListing} className="space-y-4">
                <div className="p-3 rounded-2xl bg-[var(--bg-main)]/60 border border-[var(--border-card)] flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-muted)]">Usuario Conectado:</span>
                  <strong className="text-[var(--text-heading)] font-bold">
                    {currentUser.name} (@{currentUser.gamertag})
                  </strong>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase block">
                    Tipo de Publicación
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setListingType('JUGADOR_BUSCA_CLUB')}
                      className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all ${
                        listingType === 'JUGADOR_BUSCA_CLUB'
                          ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-md'
                          : 'bg-[var(--bg-main)]/40 border-[var(--border-card)] text-[var(--text-muted)]'
                      }`}
                    >
                      🙋 Agente Libre (Mi Perfil)
                    </button>
                    <button
                      type="button"
                      onClick={() => setListingType('CLUB_RECLUTA_JUGADOR')}
                      className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all ${
                        listingType === 'CLUB_RECLUTA_JUGADOR'
                          ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-md'
                          : 'bg-[var(--bg-main)]/40 border-[var(--border-card)] text-[var(--text-muted)]'
                      }`}
                    >
                      🛡️ Reclutamiento de Mi Club
                    </button>
                  </div>
                </div>

                {/* Team check when posting as Club Recruitment */}
                {listingType === 'CLUB_RECLUTA_JUGADOR' && !hasTeam && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Se requiere liderazgo de un club registrado para reclutar.</span>
                    </div>
                    <Link href={`/${currentGameSlug}/equipos`} className="block">
                      <Button size="sm" variant="outline" className="w-full text-[11px] font-mono border-amber-500/40 text-amber-300 hover:bg-amber-950/80">
                        Ver o Registrar Mi Escuadra &rarr;
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase block">
                      Posición Táctica ({currentGameObj.name})
                    </label>
                    <select
                      value={positionInput}
                      onChange={(e) => setPositionInput(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--game-brand)] cursor-pointer"
                    >
                      {dbGameConfig.positions.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase block">
                      Plataforma
                    </label>
                    <select
                      value={platformInput}
                      onChange={(e) => setPlatformInput(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs font-mono text-[var(--text-primary)] focus:outline-none"
                    >
                      <option value="CROSSPLAY">CROSSPLAY</option>
                      <option value="PS5">PS5</option>
                      <option value="PC">PC</option>
                      <option value="XBOX">XBOX</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase block">
                    Mensaje Propuesta / Requisitos (Caduca en {dbGameConfig.postExpirationDays} Días)
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder={
                      listingType === 'JUGADOR_BUSCA_CLUB'
                        ? 'Describe tu experiencia, horarios de disponibilidad y lo que buscas...'
                        : 'Describe los requisitos para incorporarse a tu club, horario de pruebas...'
                    }
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--game-brand)]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreateModal(false)}
                    className="text-xs font-mono"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || (listingType === 'CLUB_RECLUTA_JUGADOR' && !hasTeam)}
                    className="text-xs font-mono font-bold"
                    style={{ backgroundColor: currentGameObj.brandColor, color: '#020617' }}
                  >
                    {submitting ? 'Guardando en BD...' : `Publicar (Válido ${dbGameConfig.postExpirationDays} Días)`}
                  </Button>
                </div>
              </form>
            )}
        </Modal>
      )}
    </div>
  );
}
