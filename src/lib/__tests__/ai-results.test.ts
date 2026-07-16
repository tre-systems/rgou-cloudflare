import { describe, expect, it } from 'vitest';
import { benchmarkWinRate, parseDeployedAiBenchmark } from '../ai-results';

const REPORT = `# Deployed AI Matchup Results

_Last updated: 16/07/2026, 14:11:06_

## Configuration

- **Games per match:** 400

## Matrix Table

| AI Type | Classic-Browser | ML-Classic | Oracle-V1 |
| --- | --- | --- | --- |
| Classic-Browser | - | 48.2 | 15.0 |
| ML-Classic | 51.8 | - | 20.2 |
| Oracle-V1 | 85.0 | 79.8 | - |
`;

describe('deployed AI benchmark', () => {
  it('parses the generated report into display-ready data', () => {
    const benchmark = parseDeployedAiBenchmark(REPORT);

    expect(benchmark.generatedAt).toBe('16/07/2026, 14:11:06');
    expect(benchmark.gamesPerMatch).toBe(400);
    expect(benchmark.opponents.map(opponent => opponent.shortLabel)).toEqual([
      'Classic',
      'ML',
      'Oracle',
    ]);
    expect(benchmarkWinRate(benchmark, 'Oracle-V1', 'Classic-Browser')).toBe(85);
  });

  it('rejects incomplete or unknown reports', () => {
    expect(() => parseDeployedAiBenchmark('# missing')).toThrow('incomplete');
    expect(() => parseDeployedAiBenchmark(REPORT.replace('Oracle-V1', 'Unknown-AI'))).toThrow(
      'Unknown deployed AI'
    );
  });
});
