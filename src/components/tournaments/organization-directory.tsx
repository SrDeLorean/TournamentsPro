'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GameConfig } from '@/lib/games-data';
import { PageHeader } from '@/components/ui/page-header';
import { Building2, Trophy, Users, Shield, Award, Search, Crown, X, Star, Globe, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TacticalLoadingSkeleton } from '@/components/tournaments/tactical-loading-skeleton';
import { getOrganizationsWithStatsAction, OrgWithStats } from '@/app/actions/organizations';
import { Pagination } from '@/components/ui/pagination';

import { EsportsCard } from '@/components/ui/esports-card';
import { FilterBar } from '@/components/ui/filter-bar';

interface OrganizationDirectoryProps {
  gameSlug: string;
  gameConfig: GameConfig;
}

export function OrganizationDirectory({ gameSlug, gameConfig }: OrganizationDirectoryProps) {
  const [orgs, setOrgs] = useState<OrgWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const fetchOrgs = async () => {
      try {
        const res = await getOrganizationsWithStatsAction(gameSlug);
        if (res.success && res.organizations) {
          if (isMounted) setOrgs(res.organizations);
        }
      } catch (err) {
        console.error('Error fetching orgs:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchOrgs();
    return () => {
      isMounted = false;
    };
  }, [gameSlug]);

  const filteredOrgs = orgs.filter((org) => {
    const term = searchTerm.toLowerCase();
    return org.name.toLowerCase().includes(term) || (org.tag && org.tag.toLowerCase().includes(term));
  });

  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredOrgs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrgs = filteredOrgs.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, orgs]);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="pt-4 sm:pt-6">
        <PageHeader
          badgeText="DIRECTORIO DE TORNEOS"
          badgeIcon={<Trophy className="w-3.5 h-3.5" style={{ color: 'var(--game-brand)', fill: 'var(--game-brand)' }} />}
          title="ORGANIZACIONES &"
          highlightTitle="TORNEOS"
          description={`Explora las comunidades oficiales, ligas verificadas y organizadores que administran el ecosistema competitivo de ${gameConfig.name}.`}
          brandColor="var(--game-brand)"
        />
      </div>

      {isLoading ? (
        <div className="pt-8">
          <TacticalLoadingSkeleton game={gameConfig} message={`SINCRONIZANDO COMUNIDADES DE ${gameConfig.name}...`} />
        </div>
      ) : (
        <>
          {/* ── TACTICAL FILTER BAR ────────────────────────────── */}
          <div className="mb-8 mt-6">
            <FilterBar
              searchPlaceholder="Buscar organizaciones o comunidades por nombre o tag..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              count={filteredOrgs.length}
              countLabel="ORGS ENCONTRADAS"
              brandColor="var(--game-brand)"
            />
          </div>

          {/* ── GRID ────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 mt-6 pb-8">
            {currentOrgs.map((org, index) => {
              const bannerImg = (org as any).banner_url || (org as any).bannerUrl || gameConfig.bannerUrl || '/images/default/banner-default.jpg';
              const logoImg = (org as any).logo_url || (org as any).logoUrl || '/images/default/logo-default.png';
              const countryStr = (org as any).country || 'Global';
              const ratingStr = (org as any).rating || '4.98';

              return (
                <EsportsCard
                  key={org.id}
                  href={`/${gameSlug}/organizacion/${org.id}`}
                  title={org.name}
                  subtitle={org.tag ? `[${org.tag}] Comunidad eSports` : 'Comunidad eSports'}
                  description={org.description || 'Comunidad oficial eSports y administradora de torneos comunitarios.'}
                  bannerUrl={bannerImg}
                  logoUrl={logoImg}
                  tag={org.tag}
                  country={countryStr}
                  socials={
                    (org as any).socialMedia || {
                      whatsapp: (org as any).whatsapp,
                      instagram: (org as any).instagram,
                      twitter: (org as any).twitter,
                      twitch: (org as any).twitch,
                      discord: (org as any).discord,
                      tiktok: (org as any).tiktok,
                      youtube: (org as any).youtube,
                      website: (org as any).website,
                    }
                  }
                  badges={[{ text: 'VERIFICADA', variant: 'emerald', pulse: true }]}
                  stats={[
                    { icon: <Trophy className="w-3.5 h-3.5 text-amber-400" />, label: 'Torneos', value: org.comp_count || 0 },
                    { icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />, label: 'Prestigio', value: ratingStr, highlight: true },
                  ]}
                  footerLeft={
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Oficial TP</span>
                    </span>
                  }
                  actionText="VER PERFIL"
                  brandColor="var(--game-brand)"
                  animationDelay={index * 50}
                />
              );
            })}
            {filteredOrgs.length === 0 && (
              <div className="col-span-full py-16 text-center border border-dashed border-[var(--border-card)] rounded-3xl glass-panel">
                <Trophy className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-[var(--text-heading)]">No hay organizaciones encontradas</h3>
                <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto mt-2">Prueba usando otro término de búsqueda.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}
