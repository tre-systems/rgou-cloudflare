#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { closeSync, openSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

const root = realpathSync(process.cwd());
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const scripts = new Set(Object.keys(packageJson.scripts ?? {}));
const deletedFiles = new Set(
  execFileSync('git', ['ls-files', '-z', '--deleted'], { cwd: root, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
);
const markdownFiles = execFileSync(
  'git',
  ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', '*.md'],
  {
    cwd: root,
    encoding: 'utf8',
  }
)
  .split('\0')
  .filter(file => file && !deletedFiles.has(file));
const failures = [];

function repositoryPath(path) {
  const resolved = realpathSync(path);
  const repositoryRelative = relative(root, resolved);
  if (
    repositoryRelative === '..' ||
    repositoryRelative.startsWith(`..${sep}`) ||
    isAbsolute(repositoryRelative)
  ) {
    throw new Error('path leaves the repository');
  }
  return resolved;
}

function readRepositoryFile(path) {
  const descriptor = openSync(repositoryPath(path), 'r');
  try {
    return readFileSync(descriptor, 'utf8');
  } finally {
    closeSync(descriptor);
  }
}

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
  const trimmedTarget = rawTarget.trim();
  const unwrappedTarget =
    trimmedTarget.startsWith('<') && trimmedTarget.endsWith('>')
      ? trimmedTarget.slice(1, -1)
      : trimmedTarget;
  const target = unwrappedTarget.split(/\s+["']/u, 1)[0];
  if (!target || /^(?:https?:|mailto:)/u.test(target)) return;

  let destination;
  let rawAnchor;
  try {
    const [rawPath, anchor = ''] = target.split('#', 2);
    destination = rawPath ? resolve(root, dirname(source), decodeURIComponent(rawPath)) : source;
    rawAnchor = anchor;
    repositoryPath(destination);
  } catch {
    failures.push(`${source}: missing link target ${target}`);
    return;
  }
  if (!rawAnchor) return;

  try {
    const anchors = headingAnchors(readRepositoryFile(destination));
    const anchor = decodeURIComponent(rawAnchor).toLowerCase();
    if (!anchors.has(anchor)) failures.push(`${source}: missing anchor ${target}`);
  } catch {
    failures.push(`${source}: invalid anchor target ${target}`);
  }
}

for (const file of markdownFiles) {
  const markdown = readRepositoryFile(resolve(root, file));

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
    try {
      repositoryPath(resolve(root, referencedPath));
    } catch {
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
