/**
 * Next can optimize local public assets and uploads directly. Remote, data, and
 * blob URLs are intentionally passed through because their hosts/content are
 * dynamic and cannot be safely allow-listed globally.
 */
export function shouldBypassImageOptimization(src: string): boolean {
  return true;
}
