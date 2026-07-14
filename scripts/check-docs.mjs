#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const scripts = new Set(Object.keys(packageJson.scripts ?? {}));
const markdownFiles = execFileSync(
  'git',
  ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', '*.md'],
  {
    cwd: root,
    encoding: 'utf8',
  }
)
  .split('\0')
  .filter(file => file && existsSync(resolve(root, file)));
const failures = [];

function headingAnchors(markdown) {
  const counts = new Map();
  const anchors = new Set();

  for (const match of markdown.matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)) {
    const base = match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/[`*_~]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\- ]/gu, '')
      .replace(/\s+/g, '-');
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    anchors.add(count === 0 ? base : `${base}-${count}`);
  }

  return anchors;
}

function validateTarget(source, rawTarget) {
  const target = rawTarget
    .trim()
    .replace(/^<|>$/g, '')
    .split(/\s+["']/u, 1)[0];
  if (!target || /^(?:https?:|mailto:)/u.test(target)) return;

  const [rawPath, rawAnchor = ''] = target.split('#', 2);
  const destination = rawPath
    ? resolve(root, dirname(source), decodeURIComponent(rawPath))
    : source;

  if (!existsSync(destination)) {
    failures.push(`${source}: missing link target ${target}`);
    return;
  }
  if (!rawAnchor || statSync(destination).isDirectory()) return;

  const anchors = headingAnchors(readFileSync(destination, 'utf8'));
  const anchor = decodeURIComponent(rawAnchor).toLowerCase();
  if (!anchors.has(anchor)) failures.push(`${source}: missing anchor ${target}`);
}

for (const file of markdownFiles) {
  const markdown = readFileSync(resolve(root, file), 'utf8');

  for (const match of markdown.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/gu)) {
    validateTarget(file, match[1]);
  }
  for (const match of markdown.matchAll(/<(?:a|img)\b[^>]+(?:href|src)=["']([^"']+)["']/giu)) {
    validateTarget(file, match[1]);
  }
  for (const match of markdown.matchAll(/\bnpm run ([\w:-]+)/gu)) {
    if (!scripts.has(match[1])) failures.push(`${file}: unknown npm script ${match[1]}`);
  }
  for (const match of markdown.matchAll(
    /`((?:src|docs|ml|worker|test-fixtures|\.github)\/[^`\s]+)`/gu
  )) {
    const referencedPath = match[1].replace(/[.,;:]$/u, '');
    if (!existsSync(resolve(root, referencedPath))) {
      failures.push(`${file}: missing referenced path ${referencedPath}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Documentation check failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Documentation check passed (${markdownFiles.length} files; links, anchors, repository paths, and npm commands are valid).`
);
