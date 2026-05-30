import { execSync } from 'child_process';

async function globalSetup() {
  execSync('npm run db:local:reset', { stdio: 'inherit' });
}

export default globalSetup;
