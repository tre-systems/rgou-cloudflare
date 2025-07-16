export async function getGitCommitHash(): Promise<string> {
  // Only run in Node.js environment (server-side)
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    // Check for GitHub Actions environment variable first
    if (process.env.GITHUB_SHA) {
      return process.env.GITHUB_SHA;
    }

    // Fallback to git command for local development
    try {
      const { execSync } = await import('child_process');
      return execSync('git rev-parse HEAD').toString().trim();
    } catch {
      return 'unknown';
    }
  }
  return 'unknown';
}
