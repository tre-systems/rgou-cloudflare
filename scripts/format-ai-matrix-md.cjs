#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const OUTPUT_FILE = path.resolve(__dirname, '../docs/AI-MATRIX-RESULTS.md');
const OUTPUT_DIR = path.dirname(OUTPUT_FILE);

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function parseSections(lines) {
  const sections = {
    matrix: [],
    perf: [],
    speed: [],
    recommendations: [],
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

    if (line.includes('Test Configuration:')) {
      section = 'meta';
      sections.meta.push(line);
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

    if (line.includes('SPEED ANALYSIS:')) {
      section = 'speed';
      continue;
    }

    if (line.includes('RECOMMENDATIONS:')) {
      section = 'recommendations';
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
        return [match[1], match[2], match[3]];
      }
      return null;
    })
    .filter(Boolean);

  if (!rows.length) return speedLines.join('\n');

  let table = '| AI | ms/move | Speed |\n| --- | --- | --- |\n';
  for (const [ai, ms, speed] of rows) {
    table += `| ${ai} | ${ms} | ${speed} |\n`;
  }

  return table.trimEnd();
}

function formatRecommendations(lines) {
  if (!lines.length) return '';

  return lines
    .filter(
      line =>
        !line.includes('test result:') && !line.includes('running') && !line.includes('test test_')
    )
    .map(line => {
      const cleanLine = line.trim().replace(/^[•*-]\s*/, '');
      return `- ${cleanLine}`;
    })
    .join('\n');
}

function formatMeta(metaLines) {
  if (!metaLines.length) return '';

  return metaLines
    .map(line => {
      if (line.includes('Test Configuration:')) {
        return '**Test Configuration:**';
      }
      return line.trim();
    })
    .join('\n');
}

async function main() {
  console.log('Starting AI matrix test formatting...');

  const lines = [];
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) lines.push(line);

  console.log(`Parsing ${lines.length} lines of output...`);
  const sections = parseSections(lines);

  ensureDirSync(OUTPUT_DIR);

  const md = [
    '# AI Matrix Test Results',
    '',
    `_Last updated: ${sections.date}_`,
    '',
    '## Matrix Table',
    '',
    formatMeta(sections.meta),
    '',
    formatMatrixTable(sections.matrix),
    '',
    '## Performance Summary',
    '',
    formatPerfSummary(sections.perf),
    '',
    '## Speed Analysis',
    '',
    formatSpeedAnalysis(sections.speed),
    '',
    '## Recommendations',
    '',
    formatRecommendations(sections.recommendations),
    '',
  ].join('\n');

  fs.writeFileSync(OUTPUT_FILE, md, 'utf8');
  console.log(`AI matrix results saved to ${OUTPUT_FILE}`);
}

main();
