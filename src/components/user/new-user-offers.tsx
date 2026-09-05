'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { CrudAlertBanner, useCrudNotifier } from '@/components/ui/crud-alert';
import { Inbox, CheckCircle2, XCircle } from 'lucide-react';
import { getUserOffersAction, respondNewContractOfferService } from '@/app/actions/new-transfers';

export function NewUserOffersView() {
  const { currentUser } = useAuth();
  type UserOffer = Awaited<ReturnType<typeof getUserOffersAction>>['offers'][number] & {
    id: string;
    pitch_message?: string;
    created_at: string;
    logo_url?: string;
    team_name: string;
    team_tag?: string;
  };
  const [offers, setOffers] = useState<UserOffer[]>([]);
  const { crudState, startOperation, endSuccess, endError, resetAlert } = useCrudNotifier();

  const loadOffers = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const res = await getUserOffersAction(currentUser.id);
      if (res.success) setOffers(res.offers as UserOffer[]);
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const timer = window.setTimeout(() => void loadOffers(), 0);
    return () => window.clearTimeout(timer);
  }, [currentUser?.id, loadOffers]);

  const handleResponse = async (offerId: string, action: 'ACEPTADO' | 'RECHAZADO') => {
    startOperation(`Responder Oferta`);
    try {
      const res = await respondNewContractOfferService(offerId, action);
      if (res.success) {
        endSuccess(res.message || `Has ${action.toLowerCase()} el contrato con éxito.`);
        loadOffers();
      } else {
        endError(res.error || 'Error al procesar el contrato.');
      }
    } catch (error: unknown) {
      endError(error instanceof Error ? error.message : 'Error al procesar el contrato.');
    }
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <CrudAlertBanner state={crudState} onClose={resetAlert} />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Inbox className="w-6 h-6 text-[var(--primary)]" /> Bandeja de Ofertas
        </h2>
        <Badge variant="slate" className="text-xs">
          {offers.length} OFERTA(S) PENDIENTE(S)
        </Badge>
      </div>

      {offers.length === 0 ? (
        <Card className="glass-card border-[var(--border-card)] bg-[var(--bg-card)] text-center py-16">
          <Inbox className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-muted)] text-sm">No tienes ofertas de contrato pendientes.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map(offer => {
            const orgMatch = offer.pitch_message?.match(/\[Organización:\s*([^\]]+)\]/i);
            const orgName = orgMatch ? orgMatch[1] : 'General';
            const date = new Date(offer.created_at).toLocaleString();

            return (
              <Card key={offer.id} className="glass-card border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--primary)]/50 transition-colors">
                <CardHeader className="pb-3 border-b border-[var(--border-card)] bg-[var(--bg-elevated)]">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar src={offer.logo_url} fallback={offer.team_name} className="w-12 h-12 rounded border border-[var(--border-card)]" />
                      <div>
                        <CardTitle className="text-lg">{offer.team_name}</CardTitle>
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{offer.team_tag}</p>
                      </div>
                    </div>
                    <Badge variant="slate" className="text-xs  bg-[var(--bg-elevated)] border-[var(--border-card)] text-[var(--text-secondary)]">
                      {date}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 p-3 rounded-lg text-sm text-[var(--text-muted)]">
                    El club te ha ofrecido un contrato oficial para participar en la organización:
                    <div className="mt-2 text-[var(--text-heading)] font-bold uppercase">{orgName}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-[var(--app-positive-soft)] text-[var(--app-positive)] hover:bg-[var(--app-positive)] hover:text-[var(--accent-contrast)] border border-[var(--app-positive)]"
                      onClick={() => handleResponse(offer.id, 'ACEPTADO')}
                      disabled={crudState.status === 'LOADING'}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Aceptar
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 text-[var(--app-danger)] hover:bg-[var(--app-danger-soft)] border-[var(--app-danger)]"
                      onClick={() => handleResponse(offer.id, 'RECHAZADO')}
                      disabled={crudState.status === 'LOADING'}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Rechazar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
