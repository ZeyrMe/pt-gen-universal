/** Prefix applies only to rendered posters; source URLs remain unchanged. */
export function getPosterUrl(poster: unknown, prefix?: string): string {
  const url = String(poster || '');
  return url && prefix ? prefix + url : url;
}
