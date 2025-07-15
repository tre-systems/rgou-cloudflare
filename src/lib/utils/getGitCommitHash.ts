import { execSync } from 'child_process';

export function getGitCommitHash(): string {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}
