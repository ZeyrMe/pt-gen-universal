/** Build a derived proxy URL without mutating the source poster URL. */
export function getPosterUrl(poster: unknown, prefix?: string): string {
  const url = String(poster || '');
  const normalizedPrefix = String(prefix || '').trim();
  return url && normalizedPrefix ? normalizedPrefix + url : url;
}
