import { Loader2, Search, Send, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RecruitmentState } from '../use-recruitment';

const positions = ['ALL', 'DC', 'MCO', 'MC', 'MCD', 'DFC', 'LD', 'LI', 'EI', 'ED', 'PO'];

export function RecruitmentSearch({ state }: { state: RecruitmentState }) {
  const {
    searchQuery, setSearchQuery, positionFilter, setPositionFilter,
    filteredPlayers, isLoadingPlayers, openOfferModal,
  } = state;
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por Gamertag o Nombre..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9 text-xs bg-[var(--bg-main)] border-[var(--border-card)] font-mono"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {positions.map((position) => (
            <button
              key={position}
              type="button"
              onClick={() => setPositionFilter(position)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                positionFilter === position
                  ? 'bg-cyan-500 text-black'
                  : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-white border border-[var(--border-card)]'
              }`}
            >
              {position === 'ALL' ? 'TODAS' : position}
            </button>
          ))}
        </div>
      </div>
      {isLoadingPlayers ? (
        <div className="p-12 text-center text-[var(--text-muted)] text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          Buscando atletas disponibles...
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-card)] text-[var(--text-muted)] text-xs space-y-2">
          <Users className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-50" />
          <p className="font-bold text-[var(--text-primary)]">No se encontraron atletas disponibles para este filtro.</p>
          <p>Intenta con otra posición o término de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-cyan-500/50 transition-all flex flex-col justify-between gap-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <Avatar
                  src={player.avatarUrl || player.foto || undefined}
                  fallback={player.gamertag?.slice(0, 2).toUpperCase() || 'PL'}
                  size="md"
                  className="ring-2 ring-cyan-500/30 flex-shrink-0"
                />
                <div className="min-w-0 space-y-1">
                  <h4 className="font-black text-sm text-[var(--text-heading)] uppercase truncate">
                    {player.gamertag || player.name}
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">{player.name}</p>
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <Badge variant="cyan" className="text-[10px] font-mono">{player.position || 'DFC'}</Badge>
                    {player.secondaryPosition && (
                      <Badge variant="slate" className="text-[10px] font-mono text-[var(--text-muted)]">
                        {player.secondaryPosition}
                      </Badge>
                    )}
                    <Badge variant="gold" className="text-[10px] font-mono">★ {player.rating || '9.0'}</Badge>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => openOfferModal(player)}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                Ofertar Contrato
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
