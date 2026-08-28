import { NextResponse } from 'next/server';
import { queryRows } from '@/lib/db/provider';
import { getRequestId, logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const startedAt = performance.now();

  try {
    await queryRows<{ ok: number }>('SELECT 1 AS ok');
    const response = NextResponse.json({ status: 'ok', database: 'ok' });
    response.headers.set('x-request-id', requestId);
    logger.info('health.ready', { requestId, durationMs: Math.round(performance.now() - startedAt) });
    return response;
  } catch (error) {
    const response = NextResponse.json(
      { status: 'degraded', database: 'unavailable' },
      { status: 503 },
    );
    response.headers.set('x-request-id', requestId);
    logger.error('health.unavailable', {
      requestId,
      durationMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : 'unknown',
    });
    return response;
  }
}

