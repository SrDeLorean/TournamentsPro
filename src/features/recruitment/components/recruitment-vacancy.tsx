import { Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RecruitmentState } from '../use-recruitment';

const positions = ['DFC', 'LD', 'LI', 'MCD', 'MC', 'MCO', 'DC', 'EI', 'ED', 'PO'];

export function RecruitmentVacancy({ state }: { state: RecruitmentState }) {
  const {
    selectedTeam, vacancyPosition, setVacancyPosition, vacancyMessage, setVacancyMessage,
    isPostingVacancy, postVacancy,
  } = state;
  return (
    <Card className="border-[var(--border-card)] bg-[var(--bg-card)] max-w-2xl mx-auto">
      <CardHeader className="border-b border-[var(--border-card)]">
        <CardTitle className="text-base font-black uppercase text-[var(--text-heading)] flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-cyan-400" />
          <span>Publicar Convocatoria Abierta en el Muro de Traspasos</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={postVacancy} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase block mb-1.5">
              Club Convocante
            </label>
            <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-card)] font-black text-sm text-[var(--text-heading)] uppercase">
              {selectedTeam?.name} ({selectedTeam?.gameSlug.toUpperCase()})
            </div>
          </div>
          <div>
            <label htmlFor="vacancy-position" className="text-xs font-bold text-[var(--text-muted)] uppercase block mb-1.5">
              Posición Táctica Solicitada
            </label>
            <select
              id="vacancy-position"
              value={vacancyPosition}
              onChange={(event) => setVacancyPosition(event.target.value)}
              className="w-full bg-[var(--bg-main)] text-[var(--text-heading)] font-mono text-xs p-3 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-[var(--accent-cyan)]"
            >
              {positions.map((position) => <option key={position} value={position}>{position}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="vacancy-message" className="text-xs font-bold text-[var(--text-muted)] uppercase block mb-1.5">
              Mensaje / Requisitos de la Convocatoria
            </label>
            <textarea
              id="vacancy-message"
              rows={3}
              value={vacancyMessage}
              onChange={(event) => setVacancyMessage(event.target.value)}
              placeholder={`Ej: Buscamos ${vacancyPosition} con experiencia para competir en la liga oficial de la organización.`}
              className="w-full bg-[var(--bg-main)] text-[var(--text-heading)] font-mono text-xs p-3 rounded-xl border border-[var(--border-card)] focus:outline-none focus:border-[var(--accent-cyan)]"
            />
          </div>
          <Button
            type="submit"
            disabled={isPostingVacancy}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg"
          >
            {isPostingVacancy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
            Publicar Convocatoria en Traspasos
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
