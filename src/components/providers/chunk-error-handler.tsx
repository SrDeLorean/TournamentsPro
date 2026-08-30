'use client';

import { useEffect } from 'react';

const CHUNK_RETRY_KEY = 'tournamentspro:chunk-retry';
const CHUNK_RETRY_WINDOW_MS = 60_000;

/**
 * Recovers once from a stale document after a deployment. The cache-busting
 * query forces intermediate CDNs to request the HTML for the active release.
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
        const previousRetry = Number(window.sessionStorage.getItem(CHUNK_RETRY_KEY) || 0);
        const now = Date.now();

        if (now - previousRetry < CHUNK_RETRY_WINDOW_MS) {
          console.error('No fue posible recuperar los recursos de la publicación activa.', event);
          return;
        }

        window.sessionStorage.setItem(CHUNK_RETRY_KEY, String(now));
        const recoveryUrl = new URL(window.location.href);
        recoveryUrl.searchParams.set('__dpl_retry', String(now));
        window.location.replace(recoveryUrl.toString());
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
