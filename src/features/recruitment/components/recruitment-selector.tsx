import { Briefcase, Search, Send } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TabList } from '@/components/ui/tab-list';
import type { RecruitmentState } from '../use-recruitment';
import type { RecruitmentTab } from '../types';

const tabs: { id: RecruitmentTab; label: string; Icon: typeof Search }[] = [
  { id: 'SEARCH_PLAYERS', label: 'Buscar Atletas', Icon: Search },
  { id: 'SENT_OFFERS', label: 'Ofertas Enviadas', Icon: Send },
  { id: 'POST_VACANCY', label: 'Publicar Vacante', Icon: Briefcase },
];

export function RecruitmentSelector({ state }: { state: RecruitmentState }) {
  const { teams, selectedTeam, selectedTeamId, setSelectedTeamId, activeTab, setActiveTab } = state;
  return (
    <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Avatar
          src={selectedTeam?.logoUrl || undefined}
          fallback={selectedTeam?.tag || selectedTeam?.name.slice(0, 2).toUpperCase()}
          size="md"
          className="ring-2 ring-[var(--accent-cyan)]/40"
        />
        <div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-bold">
            Club Emisor de Fichajes
          </span>
          <div className="flex items-center gap-2">
            <select
              value={selectedTeamId}
              onChange={(event) => setSelectedTeamId(event.target.value)}
              className="bg-[var(--bg-main)] text-[var(--text-heading)] font-black text-sm uppercase px-3 py-1.5 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-[var(--accent-cyan)]"
              aria-label="Club emisor de fichajes"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.gameSlug.toUpperCase()})
                </option>
              ))}
            </select>
            {selectedTeam?.organizations?.[0] && (
              <Badge variant="violet" className="text-[10px] font-mono hidden md:inline-flex">
                {selectedTeam.organizations[0].organization_name}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <TabList label="Opciones de reclutamiento" className="flex items-center gap-1.5 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-card)] w-full sm:w-auto">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            tabIndex={activeTab === id ? 0 : -1}
            onClick={() => setActiveTab(id)}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === id
                ? 'bg-[var(--accent-cyan)] text-black shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </TabList>
    </div>
  );
}
