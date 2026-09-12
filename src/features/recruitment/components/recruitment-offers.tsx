import { Loader2, Send, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RecruitmentState } from '../use-recruitment';

export function RecruitmentOffers({ state }: { state: RecruitmentState }) {
  const { selectedTeam, outgoingOffers, isLoadingOffers, isPending, cancelOffer } = state;
  return (
    <Card className="border-[var(--border-card)] bg-[var(--bg-card)]">
      <CardHeader className="border-b border-[var(--border-card)]">
        <CardTitle className="text-base font-black uppercase text-[var(--text-heading)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            <span>Propuestas de Contrato Emitidas por {selectedTeam?.name}</span>
          </div>
          <Badge variant="cyan" className="text-xs font-mono">
            {outgoingOffers.length} Emitida{outgoingOffers.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoadingOffers ? (
          <div className="p-12 text-center text-[var(--text-muted)] text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            Cargando propuestas enviadas...
          </div>
        ) : outgoingOffers.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-card)] text-[var(--text-muted)] text-xs space-y-2">
            <Send className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-50" />
            <p className="font-bold text-[var(--text-primary)]">No has emitido ofertas de contrato desde este club.</p>
            <p>Usa la pestaña &ldquo;Buscar Atletas&rdquo; para convocar agentes libres a tu plantilla.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {outgoingOffers.map((offer) => (
              <div
                key={offer.id}
                className="p-4 rounded-xl border border-[var(--border-card)] bg-[var(--bg-main)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-[var(--text-heading)] uppercase">
                      {offer.player_gamertag || offer.player_name}
                    </span>
                    <Badge variant="cyan" className="text-[10px] font-mono">Posición: {offer.position}</Badge>
                    <Badge
                      variant={offer.status === 'ACEPTADO' ? 'emerald' : offer.status === 'RECHAZADO' ? 'rose' : 'violet'}
                      className="text-[10px] font-mono"
                    >
                      {offer.status}
                    </Badge>
                  </div>
                  {offer.pitch_message && (
                    <p className="text-[11px] text-[var(--text-muted)] italic">&ldquo;{offer.pitch_message}&rdquo;</p>
                  )}
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Enviada el {new Date(offer.created_at).toLocaleDateString()}
                  </p>
                </div>
                {offer.status === 'PENDIENTE' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => cancelOffer(offer.id)}
                    className="text-rose-400 hover:bg-rose-500/10 font-bold text-xs flex items-center gap-1 self-end sm:self-center"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancelar Oferta
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
