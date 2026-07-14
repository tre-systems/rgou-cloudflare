const CANONICAL_HOST = 'gameofur.org';

const REDIRECT_HOSTS = new Set([
  'www.gameofur.org',
  'gameofur.net',
  'www.gameofur.net',
  'rgou.tre.systems',
]);

export function getCanonicalRedirectUrl(requestUrl: string): string | null {
  const url = new URL(requestUrl);

  if (url.hostname === CANONICAL_HOST && url.protocol === 'https:') return null;
  if (url.hostname !== CANONICAL_HOST && !REDIRECT_HOSTS.has(url.hostname)) return null;

  url.protocol = 'https:';
  url.hostname = CANONICAL_HOST;
  url.port = '';
  return url.toString();
}
