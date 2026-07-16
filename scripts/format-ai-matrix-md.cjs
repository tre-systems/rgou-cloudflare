#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

function resolveReportName(value) {
  if (value === undefined || value === 'matrix') return 'matrix';
  if (value === 'deployed') return 'deployed';
  throw new Error(`Unknown AI matrix report: ${value}`);
}

const REPORT_NAME = resolveReportName(process.env.AI_MATRIX_REPORT);
const IS_DEPLOYED_REPORT = REPORT_NAME === 'deployed';
const OUTPUT_FILE = path.join(
  __dirname,
  IS_DEPLOYED_REPORT ? '../docs/AI-DEPLOYED-RESULTS.md' : '../docs/AI-MATRIX-RESULTS.md'
);
const REPORT_TITLE = IS_DEPLOYED_REPORT
  ? 'Deployed AI Matchup Results'
  : 'AI Matrix Test Results';
const REPORT_COMMAND = IS_DEPLOYED_REPORT
  ? 'npm run test:ai-deployed:md'
  : 'npm run test:ai-matrix:md';

function parseSections(lines) {
  const sections = {
    config: [],
    matrix: [],
    perf: [],
    speed: [],
    seats: [],
    meta: [],
    date: new Date().toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      hour12: false,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };

  let section;

  for (const line of lines) {
    if (
      line.startsWith('=') ||
      line.startsWith('-') ||
      line.trim() === '' ||
      line.includes('test result:') ||
      line.includes('running') ||
      line.includes('test test_') ||
      line.includes('🎉 AI Matrix test completed')
    )
      continue;

    if (line.trim() === 'Configuration:') {
      section = 'config';
      continue;
    }

    if (line.startsWith('Testing ')) {
      section = undefined;
      continue;
    }

    if (line.includes('Test Configuration:')) {
      section = 'meta';
      continue;
    }

    if (line.includes('MATRIX TABLE (Win Rate % of Row vs Column):')) {
      section = 'matrix';
      continue;
    }

    if (line.includes('PERFORMANCE SUMMARY:')) {
      section = 'perf';
      continue;
    }

    if (line.includes('SEAT BALANCE:')) {
      section = 'seats';
      continue;
    }

    if (line.includes('SPEED ANALYSIS:')) {
      section = 'speed';
      continue;
    }

    if (line.includes('RECOMMENDATIONS:')) {
      section = undefined;
      continue;
    }

    if (section && line.trim()) sections[section].push(line);
  }

  return sections;
}

function formatMatrixTable(matrixLines) {
  if (!matrixLines.length) return '';

  const headerIdx = matrixLines.findIndex(l => l.includes('AI Type'));
  if (headerIdx === -1) return matrixLines.join('\n');

  const columnNames = matrixLines[headerIdx].trim().split(/\s+/);
  columnNames.splice(0, 2, 'AI Type');

  let table = `| ${columnNames.join(' | ')} |\n`;
  table += `| ${columnNames.map(() => '---').join(' | ')} |\n`;

  for (const row of matrixLines.slice(headerIdx + 1)) {
    if (!row.trim()) continue;
    const cells = row.trim().split(/\s+/);
    if (cells.length >= 2) table += `| ${cells.join(' | ')} |\n`;
  }

  return table.trimEnd();
}

function formatPerfSummary(perfLines) {
  if (!perfLines.length) return '';

  return perfLines.map(line => line.trim()).join('\n');
}

function formatSpeedAnalysis(speedLines) {
  if (!speedLines.length) return '';

  const rows = speedLines
    .map(line => {
      const match = line.match(/^(.+?):\s*([\d.]+)ms\/move\s*\((.+?)\)/);
      if (match) {
        return [match[1], match[2]];
      }
      return null;
    })
    .filter(Boolean);

  if (!rows.length) return speedLines.join('\n');

  let table = '| AI | ms/move |\n| --- | --- |\n';
  for (const [ai, ms] of rows) {
    table += `| ${ai} | ${ms} |\n`;
  }

  return table.trimEnd();
}

function formatSeatBalance(seatLines) {
  const rows = seatLines
    .map(line => line.trim().match(/^(.+?) vs (.+?): Player 1 ([\d.]+)%, Player 2 ([\d.]+)%$/))
    .filter(Boolean);

  if (!rows.length) return '';

  let table = '| Matchup | First seat | Second seat |\n| --- | --- | --- |\n';
  for (const [, ai1, ai2, player1, player2] of rows) {
    table += `| ${ai1} vs ${ai2} | ${player1}% | ${player2}% |\n`;
  }

  return table.trimEnd();
}

function formatFacts(lines) {
  return lines
    .map(line => line.trim().match(/^(.+?):\s*(.+)$/))
    .filter(Boolean)
    .map(([, label, value]) => `- **${label}:** ${value}`)
    .join('\n');
}

function validateSections(sections) {
  for (const name of ['config', 'matrix', 'perf', 'speed']) {
    if (sections[name].length === 0) {
      throw new Error(`AI matrix output is missing the ${name} section`);
    }
  }
}

async function main() {
  console.log('Starting AI matrix test formatting...');

  const lines = [];
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) lines.push(line);

  console.log(`Parsing ${lines.length} lines of output...`);
  const sections = parseSections(lines);
  validateSections(sections);

  fs.writeFileSync(OUTPUT_FILE, formatMarkdown(sections), 'utf8');
  console.log(`AI matrix results saved to ${OUTPUT_FILE}`);
}

function formatMarkdown(sections) {
  const includeSeatBalance = sections.config.some(line =>
    line.includes('Scope: browser-deployed opponents only')
  );

  return [
    `# ${REPORT_TITLE}`,
    '',
    `_Last updated: ${sections.date}_`,
    '',
    `> Generated by \`${REPORT_COMMAND}\`. Win rates are stochastic and timings are hardware-dependent; compare AIs within the same run.`,
    '',
    '## Configuration',
    '',
    formatFacts([...sections.config, ...sections.meta]),
    '',
    '## Matrix Table',
    '',
    "Each cell is the row AI's win rate against the column AI.",
    '',
    formatMatrixTable(sections.matrix),
    '',
    ...(includeSeatBalance
      ? ['## Seat balance', '', formatSeatBalance(sections.seats), '']
      : []),
    '## Performance Summary',
    '',
    formatPerfSummary(sections.perf),
    '',
    '## Speed Analysis',
    '',
    formatSpeedAnalysis(sections.speed),
    '',
  ].join('\n');
}

if (require.main === module) void main();

module.exports = { formatMarkdown, parseSections, resolveReportName, validateSections };
