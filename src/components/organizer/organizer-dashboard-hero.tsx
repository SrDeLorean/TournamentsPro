'use client';

import Image from 'next/image';
import { Building2, Gamepad2, Layers, MapPin, Swords } from 'lucide-react';
import { ManagementHero } from '@/components/dashboard/management-ui';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { GAMES_CATALOG } from '@/lib/games-data';
import { shouldBypassImageOptimization } from '@/lib/image-utils';
import type { OrganizerGameMode, OrganizerOrganization } from './organizer-dashboard-model';

interface OrganizerDashboardHeroProps {
  organization: OrganizerOrganization | null;
  selectedGameSlug: string;
  onGameChange: (slug: string) => void;
  gameModes: OrganizerGameMode[];
  selectedGameModeId: string;
  onGameModeChange: (modeId: string) => void;
}

export function OrganizerDashboardHero({
  organization,
  selectedGameSlug,
  onGameChange,
  gameModes,
  selectedGameModeId,
  onGameModeChange,
}: OrganizerDashboardHeroProps) {
  const activeGame = GAMES_CATALOG[selectedGameSlug] ?? GAMES_CATALOG.eafc26;
  const activeGameMode = gameModes.find((mode) => mode.id === selectedGameModeId) ?? gameModes[0];

  return (
    <ManagementHero
      eyebrow="Operación del organizador"
      title={organization?.name ?? 'Panel del organizador eSports'}
      description="Coordina competencias, homologaciones, fixtures y escuadras desde un espacio operativo unificado."
      icon={Building2}
      tone="violet"
      badge={organization ? `[${organization.tag}]` : 'Organizador'}
    >
      <div className="organizer-dashboard-context">
        {organization?.banner_url ? (
          <div className="organizer-dashboard-banner" aria-hidden="true">
            <Image
              src={organization.banner_url}
              alt=""
              fill
              sizes="(min-width: 1024px) 70vw, 100vw"
              unoptimized={shouldBypassImageOptimization(organization.banner_url)}
            />
          </div>
        ) : null}

        <div className="organizer-dashboard-identity">
          <div className="organizer-dashboard-logo">
            {organization?.logo_url ? (
              <Image
                src={organization.logo_url}
                alt={`Logotipo de ${organization.name}`}
                fill
                sizes="64px"
                unoptimized={shouldBypassImageOptimization(organization.logo_url)}
              />
            ) : (
              <Building2 aria-hidden="true" />
            )}
          </div>

          <div className="organizer-dashboard-identity-copy">
            <span>Organización asignada</span>
            <strong>{organization?.name ?? 'Sin organización vinculada'}</strong>
            {organization ? (
              <p>
                <span><MapPin aria-hidden="true" />{organization.country || 'Venezuela'}</span>
                <span>Est. {organization.founded_year || '2019'}</span>
                <span>★ {organization.rating || '4.98'} rating</span>
              </p>
            ) : null}
          </div>

          {organization?.organizers?.length ? (
            <div className="organizer-dashboard-team" aria-label="Equipo organizador">
              <span>Equipo organizador</span>
              <div>
                {organization.organizers.map((organizer) => (
                  <span key={organizer.id}>
                    <Avatar fallback={organizer.name} src={organizer.avatar_url || organizer.foto} size="sm" />
                    @{organizer.gamertag || organizer.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="organizer-dashboard-selectors">
          <div className="organizer-dashboard-selector">
            <div className="organizer-dashboard-selector-label"><Gamepad2 aria-hidden="true" /><span>01</span> Disciplina eSports</div>
            <div className="organizer-dashboard-options" role="group" aria-label="Seleccionar disciplina eSports">
              {Object.values(GAMES_CATALOG).map((game) => (
                <button
                  key={game.id}
                  type="button"
                  aria-pressed={game.slug === selectedGameSlug}
                  onClick={() => onGameChange(game.slug)}
                >
                  <Gamepad2 aria-hidden="true" />
                  <span>{game.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="organizer-dashboard-selector">
            <div className="organizer-dashboard-selector-label"><Swords aria-hidden="true" /><span>02</span> Modalidad de {activeGame.name}</div>
            <div className="organizer-dashboard-options" role="group" aria-label={`Seleccionar modalidad de ${activeGame.name}`}>
              {gameModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  aria-pressed={mode.id === selectedGameModeId}
                  onClick={() => onGameModeChange(mode.id)}
                >
                  <Layers aria-hidden="true" />
                  <span>{mode.name}</span>
                  <small>{mode.format}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeGameMode ? (
          <div className="organizer-dashboard-active-mode">
            <div><strong>{activeGameMode.name}</strong><span>{activeGameMode.format} · {activeGameMode.description}</span></div>
            <Badge variant="cyan">Competencia vigente</Badge>
          </div>
        ) : null}
      </div>
    </ManagementHero>
  );
}
