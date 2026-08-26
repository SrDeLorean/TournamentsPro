const REDACTED_KEYS = new Set([
  'authorization',
  'cookie',
  'credential',
  'password',
  'password_hash',
  'refreshtoken',
  'token',
]);

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogMetadata = Record<string, unknown>;

function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (Array.isArray(value)) return value.map((item) => redact(item, seen));
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';

  seen.add(value);
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      REDACTED_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : redact(child, seen),
    ]),
  );
}

export function getRequestId(request: Request): string {
  const supplied = request.headers.get('x-request-id');
  return supplied && /^[a-zA-Z0-9._:-]{8,128}$/.test(supplied)
    ? supplied
    : crypto.randomUUID();
}

export function log(level: LogLevel, event: string, metadata: LogMetadata = {}) {
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...(redact(metadata) as LogMetadata),
  });

  if (level === 'error') console.error(record);
  else if (level === 'warn') console.warn(record);
  else console.info(record);
}

export const logger = {
  debug: (event: string, metadata?: LogMetadata) => log('debug', event, metadata),
  info: (event: string, metadata?: LogMetadata) => log('info', event, metadata),
  warn: (event: string, metadata?: LogMetadata) => log('warn', event, metadata),
  error: (event: string, metadata?: LogMetadata) => log('error', event, metadata),
};
