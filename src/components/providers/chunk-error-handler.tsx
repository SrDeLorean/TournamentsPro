'use client';

import { useEffect } from 'react';

/**
 * Listener global para recargar automáticamente la app en caso de ChunkLoadError
 * (Ocurre cuando se hace un git push y el celular o navegador intenta cargar chunks antiguos 404)
 */
export function ChunkErrorHandler() {
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const errorMsg = 'reason' in event 
        ? event.reason?.message || String(event.reason)
        : event.error?.message || event.message;

      if (
        errorMsg &&
        (errorMsg.includes('ChunkLoadError') ||
          errorMsg.includes('Loading chunk') ||
          errorMsg.includes('Failed to load chunk'))
      ) {
        console.warn('⚡ Detectado ChunkLoadError por nuevo despliegue. Recargando página...');
        window.location.reload();
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleChunkError);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleChunkError);
    };
  }, []);

  return null;
}
