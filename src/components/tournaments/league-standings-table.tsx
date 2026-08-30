import { ArrowDown, ArrowUp, Crown, Minus, ShieldCheck } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Avatar } from '@/components/ui/avatar';
import type { TeamStanding } from '@/features/competitions/classification/classification-model';

interface LeagueStandingsTableProps {
  teams: TeamStanding[];
  brandColor: string;
  groupName?: string;
  qualifiedCount?: number;
}

function PositionMovement({ value }: { value?: number }) {
  if (!value) return <span className="classification-movement is-neutral" title="Sin cambios"><Minus /></span>;
  if (value > 0) return <span className="classification-movement is-up" title={`Subió ${value} ${value === 1 ? 'posición' : 'posiciones'}`}><ArrowUp /><b>{value}</b></span>;
  return <span className="classification-movement is-down" title={`Bajó ${Math.abs(value)} ${value === -1 ? 'posición' : 'posiciones'}`}><ArrowDown /><b>{Math.abs(value)}</b></span>;
}

export function LeagueStandingsTable({ teams, brandColor, groupName, qualifiedCount = 0 }: LeagueStandingsTableProps) {
  return (
    <section className="league-standings" style={{ '--standings-brand': brandColor } as CSSProperties}>
      <header className="league-standings-heading">
        <div>
          <span>{groupName || 'Tabla general'}</span>
          <strong>{teams.length} clubes en competencia</strong>
        </div>
        <div className="league-standings-legend" aria-label="Leyenda de clasificación">
          {qualifiedCount > 0 ? <span><i className="is-qualified" />Clasifica a playoff</span> : null}
          <span><ArrowUp />Sube</span><span><ArrowDown />Baja</span>
        </div>
      </header>

      <div className="league-standings-scroll" tabIndex={0} aria-label={`Clasificación ${groupName || 'general'}`}>
        <table className="classification-table league-standings-table">
          <thead>
            <tr>
              <th className="classification-position-cell" scope="col">Pos</th>
              <th className="classification-team-cell" scope="col">Club</th>
              <th className="classification-points-cell" scope="col" title="Puntos">PTS</th>
              <th scope="col" title="Partidos jugados">PJ</th>
              <th className="classification-stat-positive" scope="col" title="Ganados">G</th>
              <th className="classification-stat-neutral" scope="col" title="Empatados">E</th>
              <th className="classification-stat-negative" scope="col" title="Perdidos">P</th>
              <th scope="col" title="Diferencia de gol">DIF</th>
              <th className="classification-stat-secondary" scope="col" title="Goles a favor">GF</th>
              <th className="classification-stat-secondary" scope="col" title="Goles en contra">GC</th>
              <th className="classification-movement-cell" scope="col" title="Movimiento desde la jornada anterior">MOV</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => {
              const position = index + 1;
              const podium = position <= 3 ? `is-top-${position}` : '';
              const qualified = qualifiedCount > 0 && position <= qualifiedCount;
              return (
                <tr key={`${team.groupName}-${team.name}`} className={`${podium} ${qualified ? 'is-qualified' : ''}`}>
                  <td className="classification-position-cell">
                    <span className="classification-rank">
                      {position === 1 ? <Crown /> : position}
                    </span>
                  </td>
                  <td className="classification-team-cell">
                    <div className="classification-team-identity">
                      <Avatar src={team.logoUrl || undefined} alt={`Logo de ${team.name}`} fallback={team.tag} size="sm" />
                      <span><strong>{team.name}</strong><small>{team.tag}</small></span>
                      {qualified ? <ShieldCheck className="classification-qualified-icon" aria-label="Zona de clasificación" /> : null}
                    </div>
                  </td>
                  <td className="classification-points-cell"><strong>{team.pts}</strong></td>
                  <td>{team.pj}</td>
                  <td className="classification-stat-positive">{team.g}</td>
                  <td className="classification-stat-neutral">{team.e}</td>
                  <td className="classification-stat-negative">{team.p}</td>
                  <td className={team.dif > 0 ? 'classification-stat-positive' : team.dif < 0 ? 'classification-stat-negative' : ''}>{team.dif > 0 ? `+${team.dif}` : team.dif}</td>
                  <td className="classification-stat-secondary">{team.gf}</td>
                  <td className="classification-stat-secondary">{team.gc}</td>
                  <td className="classification-movement-cell"><PositionMovement value={team.positionChange} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
