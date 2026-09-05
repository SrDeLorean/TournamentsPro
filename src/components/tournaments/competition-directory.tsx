'use client';

import React, { useState, useEffect } from 'react';
import { GameConfig } from '@/lib/games-data';
import { PageHeader } from '@/components/ui/page-header';
import { Trophy, CalendarDays, Sword, Users } from 'lucide-react';
import { TacticalLoadingSkeleton } from '@/components/tournaments/tactical-loading-skeleton';
import { getPublicCompetitionsAction, CompetitionData } from '@/app/actions/competitions';
import { Pagination } from '@/components/ui/pagination';
import { FilterBar } from '@/components/ui/filter-bar';

import { EsportsCard } from '@/components/ui/esports-card';
import { GameExplorerPanel } from '@/components/ui/game-explorer-panel';
import { useRouter } from 'next/navigation';

interface CompetitionDirectoryProps {
  gameSlug: string;
  gameConfig: GameConfig;
}

export function CompetitionDirectory({ gameSlug, gameConfig }: CompetitionDirectoryProps) {
  const [competitions, setCompetitions] = useState<CompetitionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const fetchComps = async () => {
      try {
        const res = await getPublicCompetitionsAction(gameSlug);
        if (res.success && res.competitions) {
          if (isMounted) setCompetitions(res.competitions);
        }
      } catch (err) {
        console.error('Error fetching competitions:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchComps();
    return () => {
      isMounted = false;
    };
  }, [gameSlug]);

  const filteredComps = competitions.filter((comp) => {
    const term = searchTerm.toLowerCase();
    return comp.name.toLowerCase().includes(term) || (comp.description && comp.description.toLowerCase().includes(term));
  });

  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredComps.length / itemsPerPage);
  const visiblePage = Math.min(currentPage, Math.max(totalPages, 1));
  const startIndex = (visiblePage - 1) * itemsPerPage;
  const currentComps = filteredComps.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div
      className="animate-in fade-in duration-300"
      style={{ '--ui-dynamic-brand': gameConfig.brandColor } as React.CSSProperties}
    >
      <div className="pt-4 sm:pt-6">
        <PageHeader
          badgeText="CIRCUITO COMPETITIVO OFICIAL"
          badgeIcon={<Trophy className="ui-dynamic-brand-icon w-3.5 h-3.5" />}
          title="COMPETENCIAS POR"
          highlightTitle="DISCIPLINA"
          description={`Explora todas las competencias activas en ${gameConfig.name} de todas las organizaciones y comunidades.`}
          brandColor={gameConfig.brandColor}
        />
      </div>

      {isLoading ? (
        <div className="pt-8">
          <TacticalLoadingSkeleton game={gameConfig} message={`SINCRONIZANDO COMPETENCIAS DE ${gameConfig.name}...`} />
        </div>
      ) : (
        <>
          <GameExplorerPanel
            title="Explorar competencias oficiales"
            description={`${competitions.length} competencias activas en el portal.`}
            brandColor={gameConfig.brandColor}
            icon={<Trophy className="w-5 h-5" />}
          >
            <FilterBar
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Buscar por nombre de torneo..."
            />
          </GameExplorerPanel>

          {currentComps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mt-8">
              {currentComps.map((comp, idx) => (
                <EsportsCard
                  key={comp.id}
                  entityType="competition"
                  gameSlug={gameSlug}
                  title={comp.name}
                  subtitle={comp.organizer_name || 'Organizador'}
                  description={comp.description || 'Torneo de eSports competitivo'}
                  fallbackIcon={<Trophy className="w-12 h-12 text-[var(--text-muted)]" />}
                  animationDelay={idx * 50}
                  onClick={() => {
                     if (comp.organization_id) {
                         router.push(`/${gameSlug}/organizacion/${comp.organization_id}/competencias/${comp.id}`);
                     } else {
                         router.push(`/dashboard/competencias/${comp.id}`);
                     }
                  }}
                  badges={[
                    {
                      text: comp.status.toUpperCase(),
                      variant: comp.status === 'Inscripcion' ? 'emerald' : comp.status === 'En Curso' ? 'cyan' : 'slate',
                      pulse: comp.status === 'Inscripcion'
                    },
                    { text: comp.mode_format, variant: 'slate' }
                  ]}
                  stats={[
                    { icon: <Sword className="w-4 h-4 text-[var(--app-positive)]" />, label: 'Formato', value: comp.mode_format },
                    { icon: <CalendarDays className="w-4 h-4 text-[var(--app-accent)]" />, label: 'Inicio', value: new Date(comp.fecha_inicio).toLocaleDateString() },
                  ]}
                  footerLeft={
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                      <Trophy className="ui-dynamic-brand-ink w-3.5 h-3.5" />
                      <span>{comp.prize_pool || 'Sin premio'}</span>
                    </div>
                  }
                  actionText="VER TORNEO"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 mt-8 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--card-bg)] text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-color)] flex items-center justify-center mb-4 border border-[var(--border-color)]">
                <Trophy className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-heading)] mb-2">No se encontraron torneos</h3>
              <p className="text-[var(--text-muted)] max-w-md mx-auto">
                No hay competencias activas que coincidan con tu búsqueda.
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-12 flex justify-center pb-12">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                brandColor={gameConfig.brandColor}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
