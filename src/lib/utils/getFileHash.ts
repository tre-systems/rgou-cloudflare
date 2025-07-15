import { createHash } from 'crypto';
import { readFileSync } from 'fs';

export function getFileHash(filePath: string): string {
  try {
    const fileBuffer = readFileSync(filePath);
    const hashSum = createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch {
    return 'unknown';
  }
}
