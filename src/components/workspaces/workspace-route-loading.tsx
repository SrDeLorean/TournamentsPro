import { RouteLoading } from '@/components/ui/route-loading';

export function WorkspaceRouteLoading({ label }: { label: string }) {
  return <RouteLoading label={`Cargando ${label}`} variant="dashboard" cards={2} className="context-workspace-route-loading" />;
}
