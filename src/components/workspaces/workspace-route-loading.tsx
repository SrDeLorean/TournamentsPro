import { LoaderCircle } from 'lucide-react';

export function WorkspaceRouteLoading({ label }: { label: string }) {
  return (
    <div className="context-workspace-route-loading" role="status" aria-live="polite">
      <div className="context-workspace-route-loading-icon" aria-hidden="true">
        <LoaderCircle />
      </div>
      <div>
        <strong>Abriendo {label}</strong>
        <span>Estamos preparando únicamente la información de esta sección.</span>
      </div>
    </div>
  );
}
