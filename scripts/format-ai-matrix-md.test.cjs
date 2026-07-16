const assert = require('node:assert/strict');
const test = require('node:test');

const {
  formatMarkdown,
  parseSections,
  resolveReportName,
  validateSections,
} = require('./format-ai-matrix-md.cjs');

test('accepts only the two repository-owned report destinations', () => {
  assert.equal(resolveReportName(undefined), 'matrix');
  assert.equal(resolveReportName('matrix'), 'matrix');
  assert.equal(resolveReportName('deployed'), 'deployed');
  assert.throws(() => resolveReportName('../outside'), /Unknown AI matrix report/);
});

test('refuses to overwrite a report from incomplete test output', () => {
  assert.throws(
    () => validateSections(parseSections(['error: could not compile'])),
    /missing the config section/
  );
});

test('generated matrix documentation keeps facts and omits synthetic recommendations', () => {
  const sections = parseSections([
    'Configuration:',
    '  Games per match: 50',
    '  Include slow tests: false',
    'Testing 2 AI types:',
    'Test Configuration:',
    '  Total games played: 50',
    'MATRIX TABLE (Win Rate % of Row vs Column):',
    'AI Type Random Heuristic',
    'Random - 20.0',
    'Heuristic 80.0 -',
    'PERFORMANCE SUMMARY:',
    '1. Heuristic: 80.0% average win rate',
    'SPEED ANALYSIS:',
    'Heuristic: 0.1ms/move (Very Fast)',
    'RECOMMENDATIONS:',
    '• Use Heuristic AI',
  ]);
  sections.date = 'test date';

  const markdown = formatMarkdown(sections);

  assert.match(markdown, /\*\*Games per match:\*\* 50/);
  assert.match(markdown, /Each cell is the row AI's win rate/);
  assert.match(markdown, /\| Heuristic \| 0\.1 \|/);
  assert.doesNotMatch(markdown, /Recommendations|Very Fast|Use Heuristic AI/);
});

test('deployed reports include the seat-balanced matchup split', () => {
  const sections = parseSections([
    'Configuration:',
    '  Scope: browser-deployed opponents only',
    'Testing 2 AI types:',
    'SEAT BALANCE:',
    'Classic-Browser vs Oracle-V1: Player 1 14.0%, Player 2 16.0%',
  ]);
  sections.date = 'test date';

  const markdown = formatMarkdown(sections);

  assert.match(markdown, /## Seat balance/);
  assert.match(markdown, /Classic-Browser vs Oracle-V1 \| 14.0% \| 16.0%/);
});
