const CANONICAL_HOST = 'gameofur.org';

const REDIRECT_HOSTS = new Set([
  'www.gameofur.org',
  'gameofur.net',
  'www.gameofur.net',
  'rgou.tre.systems',
]);

export function getCanonicalRedirectUrl(requestUrl: string): string | null {
  const url = new URL(requestUrl);
  const canonicalPath = url.pathname === '/oracle-ai' ? '/ai' : null;
  const canonicalHost = url.hostname === CANONICAL_HOST || REDIRECT_HOSTS.has(url.hostname);

  if (url.hostname === CANONICAL_HOST && url.protocol === 'https:' && !canonicalPath) return null;
  if (!canonicalHost && !canonicalPath) return null;

  if (canonicalHost) {
    url.protocol = 'https:';
    url.hostname = CANONICAL_HOST;
    url.port = '';
  }
  if (canonicalPath) url.pathname = canonicalPath;
  return url.toString();
}
