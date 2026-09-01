'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

type DownloadState = 'idle' | 'preparing' | 'complete';

interface ParachuteDownloadButtonProps {
  data: string;
  fileName: string;
  label?: string;
  mimeType?: string;
  className?: string;
}

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

export function ParachuteDownloadButton({
  data,
  fileName,
  label = 'Descargar',
  mimeType = 'application/json;charset=utf-8',
  className,
}: ParachuteDownloadButtonProps) {
  const [state, setState] = useState<DownloadState>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const startDownload = async () => {
    if (state !== 'idle') return;
    setState('preparing');

    const reduceMotion = window.matchMedia(reducedMotionQuery).matches;
    await new Promise((resolve) => setTimeout(resolve, reduceMotion ? 40 : 920));

    const objectUrl = URL.createObjectURL(new Blob([data], { type: mimeType }));
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);

    setState('complete');
    resetTimer.current = setTimeout(() => setState('idle'), 1800);
  };

  const status = state === 'preparing'
    ? 'Preparando descenso'
    : state === 'complete'
      ? 'Descarga completa'
      : label;

  return (
    <button
      type="button"
      onClick={startDownload}
      disabled={state !== 'idle'}
      className={cn('parachute-download', `is-${state}`, className)}
      aria-busy={state === 'preparing'}
      aria-live="polite"
    >
      <span className="parachute-download-scene" aria-hidden="true">
        <span className="parachute-download-canopy" />
        <span className="parachute-download-lines" />
        <span className="parachute-download-crate">
          {state === 'complete' ? <Check /> : <Download />}
        </span>
        <span className="parachute-download-ground" />
      </span>
      <span className="parachute-download-copy">
        <small>{state === 'preparing' ? 'Paquete en descenso' : 'Kit de identidad'}</small>
        <strong>{status}</strong>
      </span>
    </button>
  );
}
