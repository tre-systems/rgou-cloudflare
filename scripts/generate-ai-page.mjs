#!/usr/bin/env node

// Generates public/ai.html — the static, crawlable AI article served at /ai —
// from scripts/ai-page.template.html and the win rates in docs/AI-DEPLOYED-RESULTS.md.
// Usage: node scripts/generate-ai-page.mjs [--check]
// --check verifies the committed page matches the template and benchmark without writing.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const templatePath = resolve(root, 'scripts/ai-page.template.html');
const benchmarkPath = resolve(root, 'docs/AI-DEPLOYED-RESULTS.md');
const outputPath = resolve(root, 'public/ai.html');

const BAR_TRACK_X = 200;
const BAR_TRACK_WIDTH = 460;
const BAR_LABEL_GAP = 8;

function parseBenchmark(markdown) {
  const generatedAt = markdown.match(/_Last updated: ([^_]+)_/)?.[1]?.trim();
  const gamesPerMatch = markdown.match(/\*\*Games per match:\*\* (\d+)/)?.[1];
  if (!generatedAt || !gamesPerMatch) {
    throw new Error(`Missing generated-at or games-per-match in ${benchmarkPath}`);
  }

  const isoMatch = generatedAt.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!isoMatch) throw new Error(`Unexpected generated-at format: ${generatedAt}`);
  const generatedAtIso = `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;

  const tableSection = markdown.split('## Matrix Table')[1]?.split(/\n## /)[0];
  if (!tableSection) throw new Error(`Missing "## Matrix Table" in ${benchmarkPath}`);
  const rows = tableSection
    .split('\n')
    .filter(line => line.trim().startsWith('|'))
    .map(line =>
      line
        .split('|')
        .slice(1, -1)
        .map(cell => cell.trim())
    );
  const header = rows[0];
  const winRates = new Map();
  for (const row of rows.slice(2)) {
    const [rowId, ...cells] = row;
    const rowRates = new Map();
    winRates.set(rowId, rowRates);
    cells.forEach((cell, index) => {
      const columnId = header[index + 1];
      rowRates.set(columnId, cell === '-' ? null : Number(cell));
    });
  }

  function rate(rowId, columnId) {
    const value = winRates.get(rowId)?.get(columnId);
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(`Missing or invalid win rate for ${rowId} vs ${columnId}`);
    }
    return value;
  }

  return { generatedAt, generatedAtIso, gamesPerMatch, rate };
}

function barTokens(prefix, rate) {
  const width = Math.round((rate / 100) * BAR_TRACK_WIDTH);
  return {
    [`BAR_${prefix}_W`]: String(width),
    [`BAR_${prefix}_LABEL_X`]: String(BAR_TRACK_X + width + BAR_LABEL_GAP),
  };
}

function renderPage() {
  const template = readFileSync(templatePath, 'utf8');
  const benchmark = parseBenchmark(readFileSync(benchmarkPath, 'utf8'));

  const oracleVsClassic = benchmark.rate('Oracle-V1', 'Classic-Browser');
  const oracleVsMl = benchmark.rate('Oracle-V1', 'ML-Classic');
  const mlVsClassic = benchmark.rate('ML-Classic', 'Classic-Browser');
  const classicVsMl = benchmark.rate('Classic-Browser', 'ML-Classic');
  const classicVsOracle = benchmark.rate('Classic-Browser', 'Oracle-V1');
  const mlVsOracle = benchmark.rate('ML-Classic', 'Oracle-V1');

  const tokens = {
    GENERATED_AT: benchmark.generatedAt,
    GENERATED_AT_ISO: benchmark.generatedAtIso,
    GAMES_PER_MATCH: benchmark.gamesPerMatch,
    ORACLE_V_CLASSIC: oracleVsClassic.toFixed(1),
    ORACLE_V_ML: oracleVsMl.toFixed(1),
    ML_V_CLASSIC: mlVsClassic.toFixed(1),
    CLASSIC_V_ML: classicVsMl.toFixed(1),
    CLASSIC_V_ORACLE: classicVsOracle.toFixed(1),
    ML_V_ORACLE: mlVsOracle.toFixed(1),
    ORACLE_V_CLASSIC_ROUND: String(Math.round(oracleVsClassic)),
    ORACLE_V_ML_ROUND: String(Math.round(oracleVsMl)),
    ML_V_CLASSIC_ROUND: String(Math.round(mlVsClassic)),
    CLASSIC_V_ML_ROUND: String(Math.round(classicVsMl)),
    ...barTokens('OC', oracleVsClassic),
    ...barTokens('OM', oracleVsMl),
    ...barTokens('MC', mlVsClassic),
  };

  let page = template;
  for (const [token, value] of Object.entries(tokens)) {
    page = page.replaceAll(`{{${token}}}`, value);
  }

  const leftover = page.match(/{{[A-Z0-9_]+}}/g);
  if (leftover) throw new Error(`Unreplaced template tokens: ${[...new Set(leftover)].join(', ')}`);
  return page;
}

const page = renderPage();

if (process.argv.includes('--check')) {
  let committed;
  try {
    committed = readFileSync(outputPath, 'utf8');
  } catch {
    console.error('public/ai.html is missing. Run: npm run generate:ai-page');
    process.exit(1);
  }
  if (committed !== page) {
    console.error(
      'public/ai.html is out of date with its template or benchmark. Run: npm run generate:ai-page'
    );
    process.exit(1);
  }
  console.log('public/ai.html matches the template and benchmark.');
} else {
  writeFileSync(outputPath, page);
  console.log('Generated public/ai.html');
}
