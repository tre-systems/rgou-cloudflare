import { describe, expect, it } from 'vitest';
import { getCanonicalRedirectUrl } from '../canonical-host';

describe('canonical host', () => {
  it('keeps the canonical HTTPS host', () => {
    expect(getCanonicalRedirectUrl('https://gameofur.org/play')).toBeNull();
  });

  it.each([
    'https://www.gameofur.org/',
    'https://gameofur.net/',
    'https://www.gameofur.net/',
    'https://rgou.tre.systems/',
  ])('redirects %s to the canonical host', url => {
    expect(getCanonicalRedirectUrl(url)).toBe('https://gameofur.org/');
  });

  it('preserves the path and query while upgrading HTTPS', () => {
    expect(getCanonicalRedirectUrl('http://gameofur.net/offline?source=old')).toBe(
      'https://gameofur.org/offline?source=old'
    );
  });

  it('redirects the old Oracle article to the general AI guide in one hop', () => {
    expect(getCanonicalRedirectUrl('https://www.gameofur.net/oracle-ai?source=old')).toBe(
      'https://gameofur.org/ai?source=old'
    );
    expect(getCanonicalRedirectUrl('http://localhost:5173/oracle-ai')).toBe(
      'http://localhost:5173/ai'
    );
  });
});
