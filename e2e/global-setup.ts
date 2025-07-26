import { execSync } from 'child_process';

async function globalSetup() {
  console.log('Setting up database for tests...');
  execSync('npm run db:local:reset', { stdio: 'inherit' });
}

export default globalSetup;
