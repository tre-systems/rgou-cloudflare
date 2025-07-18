export async function getFileHash(filePath: string): Promise<string> {
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    try {
      const { createHash } = await import('crypto');
      const { readFileSync } = await import('fs');
      const fileBuffer = readFileSync(filePath);
      const hashSum = createHash('sha256');
      hashSum.update(fileBuffer);
      return hashSum.digest('hex');
    } catch {
      return 'unknown';
    }
  }
  return 'unknown';
}
