#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const diagramDir = join(process.cwd(), 'docs', 'diagrams');
const probe = spawnSync('dot', ['-V'], { stdio: 'ignore' });

if (probe.error || probe.status !== 0) {
  console.error('Diagram check requires Graphviz `dot`. Install it with: brew install graphviz');
  process.exit(1);
}

const dotFiles = readdirSync(diagramDir)
  .filter(file => file.endsWith('.dot'))
  .sort();

if (dotFiles.length === 0) {
  console.error('No .dot files found in docs/diagrams.');
  process.exit(1);
}

const tempDir = mkdtempSync(join(tmpdir(), 'rgou-diagrams-'));
const failures = [];

try {
  for (const file of dotFiles) {
    const source = join(diagramDir, file);
    const committedPng = source.replace(/\.dot$/, '.png');
    const renderedPng = join(tempDir, file.replace(/\.dot$/, '.png'));

    if (!existsSync(committedPng)) {
      failures.push(`${file}: missing committed PNG`);
      continue;
    }

    const result = spawnSync('dot', ['-Tpng:cairo', source, '-Gdpi=220', '-o', renderedPng], {
      encoding: 'utf8',
    });

    if (result.error) {
      failures.push(`${file}: ${result.error.message}`);
    } else if (result.status !== 0) {
      failures.push(`${file}: dot exited ${result.status}\n${result.stderr.trim()}`);
    }
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error('Diagram check failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  console.error('Render locally with: npm run diagrams');
  process.exit(1);
}

console.log(`Diagram check passed (${dotFiles.length} diagrams render cleanly).`);
