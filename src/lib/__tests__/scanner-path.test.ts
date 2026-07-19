import { describe, expect, it } from 'vitest';
import { isScannerPath } from '../scanner-path';

describe('scanner path policy', () => {
  it.each([
    '/.env',
    '/%252eenv',
    '/.git/config',
    '/wp-admin/css/wp-login.php',
    '/php-info.php;.js',
    '/serviceAccountKey.json',
    '/app/terraform.tfvars',
    '/.ssh/id_ed25519',
  ])('rejects obvious scanner path %s', pathname => {
    expect(isScannerPath(pathname)).toBe(true);
  });

  it.each([
    '/',
    '/ai',
    '/offline',
    '/manifest.json',
    '/ml-weights.json.gz',
    '/wasm/rgou_ai_worker_bg.wasm',
    '/assets/index.js',
  ])('allows application path %s', pathname => {
    expect(isScannerPath(pathname)).toBe(false);
  });
});
