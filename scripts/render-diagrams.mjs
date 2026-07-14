#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const diagramDir = join(process.cwd(), 'docs', 'diagrams');
const probe = spawnSync('dot', ['-V'], { stdio: 'ignore' });

if (probe.error || probe.status !== 0) {
  console.error('Graphviz `dot` not found on PATH. Install it with: brew install graphviz');
  process.exit(1);
}

const dotFiles = readdirSync(diagramDir)
  .filter(file => file.endsWith('.dot'))
  .sort();

if (dotFiles.length === 0) {
  console.error('No .dot files found in docs/diagrams.');
  process.exit(1);
}

const failures = [];

for (const file of dotFiles) {
  const source = join(diagramDir, file);
  const target = source.replace(/\.dot$/, '.png');
  const result = spawnSync('dot', ['-Tpng:cairo', source, '-Gdpi=220', '-o', target], {
    encoding: 'utf8',
  });

  if (result.error) {
    failures.push(`${file}: ${result.error.message}`);
  } else if (result.status !== 0) {
    failures.push(`${file}: dot exited ${result.status}\n${result.stderr.trim()}`);
  } else {
    console.log(`rendered ${file} -> ${basename(target)}`);
  }
}

if (failures.length > 0) {
  console.error('Diagram rendering failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`${dotFiles.length} diagram(s) rendered.`);
