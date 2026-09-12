import { Loader2, Send } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import type { RecruitmentState } from '../use-recruitment';

const positions = ['DFC', 'LD', 'LI', 'MCD', 'MC', 'MCO', 'DC', 'EI', 'ED', 'PO'];

export function RecruitmentOfferModal({ state }: { state: RecruitmentState }) {
  const {
    isOfferModalOpen, setIsOfferModalOpen, selectedPlayer, selectedTeam,
    offerPosition, setOfferPosition, offerPitch, setOfferPitch, isSubmittingOffer, sendOffer,
  } = state;
  return (
    <Modal
      isOpen={isOfferModalOpen}
      onClose={() => setIsOfferModalOpen(false)}
      title={`OFERTA DE CONTRATO A ${selectedPlayer?.gamertag || selectedPlayer?.name || 'JUGADOR'}`}
    >
      <form onSubmit={sendOffer} className="space-y-4 font-mono text-xs">
        <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] flex items-center gap-3">
          <Avatar
            src={selectedPlayer?.avatarUrl || selectedPlayer?.foto || undefined}
            fallback={selectedPlayer?.gamertag?.slice(0, 2).toUpperCase() || 'PL'}
            size="md"
            className="ring-2 ring-cyan-500/30"
          />
          <div>
            <h4 className="font-black text-sm text-[var(--text-heading)] uppercase">
              {selectedPlayer?.gamertag || selectedPlayer?.name}
            </h4>
            <p className="text-[10px] text-[var(--text-muted)]">Atleta Agente Libre</p>
          </div>
        </div>
        <div>
          <label htmlFor="offer-position" className="font-bold text-[var(--text-muted)] uppercase block mb-1">
            Posición Táctica Asignada en Roster
          </label>
          <select
            id="offer-position"
            value={offerPosition}
            onChange={(event) => setOfferPosition(event.target.value)}
            className="w-full bg-[var(--bg-main)] text-[var(--text-heading)] font-mono text-xs p-2.5 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-cyan-400"
          >
            {positions.map((position) => <option key={position} value={position}>{position}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="offer-pitch" className="font-bold text-[var(--text-muted)] uppercase block mb-1">
            Mensaje de Propuesta / Condiciones
          </label>
          <textarea
            id="offer-pitch"
            rows={3}
            value={offerPitch}
            onChange={(event) => setOfferPitch(event.target.value)}
            className="w-full bg-[var(--bg-main)] text-[var(--text-heading)] font-mono text-xs p-2.5 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-cyan-400"
          />
        </div>
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-300">
          ℹ Al aceptar, el atleta se integrará de forma inmediata a la plantilla oficial de{' '}
          <span className="font-bold uppercase">{selectedTeam?.name}</span>.
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => setIsOfferModalOpen(false)} className="text-xs text-[var(--text-muted)]">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmittingOffer}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md px-4"
          >
            {isSubmittingOffer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Enviar Oferta Formal
          </Button>
        </div>
      </form>
    </Modal>
  );
}
