'use client';

import { useRouter } from 'next/navigation';
import { ClubManagementModal } from '@/components/teams/club-management-modal';
import { CreateTeamModal } from '@/components/teams/create-team-modal';
import type { TeamData } from '@/lib/data-store';

interface AdminNavbarTeamModalsProps {
  activeGameSlug: string;
  activeTeam?: TeamData;
  isCreateTeamOpen: boolean;
  isClubManageOpen: boolean;
  onCreateTeamClose: () => void;
  onClubManageClose: () => void;
}

export function AdminNavbarTeamModals({
  activeGameSlug,
  activeTeam,
  isCreateTeamOpen,
  isClubManageOpen,
  onCreateTeamClose,
  onClubManageClose,
}: AdminNavbarTeamModalsProps) {
  const router = useRouter();

  return (
    <>
      <CreateTeamModal
        isOpen={isCreateTeamOpen}
        defaultGameSlug={activeGameSlug}
        onClose={onCreateTeamClose}
        onSuccess={(team) => router.push(`/${team.gameSlug}/equipos/${team.id}`)}
      />
      {activeTeam ? (
        <ClubManagementModal
          team={activeTeam}
          isOpen={isClubManageOpen}
          onClose={onClubManageClose}
        />
      ) : null}
    </>
  );
}
