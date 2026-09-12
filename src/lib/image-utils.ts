/**
 * Local static assets under /images/ can be optimized by Next.js.
 * Dynamic uploads (/uploads/, /api/uploads/), remote URLs, data URIs,
 * and blob URLs must bypass Next's image optimizer because uploads are dynamic,
 * already optimized at ingestion, and not guaranteed to reside in the static build output.
 */
export function shouldBypassImageOptimization(src: string): boolean {
  if (!src) return true;
  const normalizedSource = src.trim();
  return /^(?:https?:\/\/|\/\/|data:|blob:|\/?(?:uploads|api\/uploads)\/)/i.test(normalizedSource);
}
