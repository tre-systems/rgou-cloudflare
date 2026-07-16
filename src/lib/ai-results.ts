export interface AiBenchmarkOpponent {
  id: string;
  label: string;
  shortLabel: string;
}

export interface AiBenchmark {
  generatedAt: string;
  gamesPerMatch: number;
  opponents: AiBenchmarkOpponent[];
  winRates: Record<string, Record<string, number | null>>;
}

const OPPONENT_LABELS: Record<string, Omit<AiBenchmarkOpponent, 'id'>> = {
  'Classic-Browser': { label: 'Classic AI', shortLabel: 'Classic' },
  'ML-Classic': { label: 'Machine Learning AI', shortLabel: 'ML' },
  'Oracle-V1': { label: 'Oracle AI', shortLabel: 'Oracle' },
};

function cells(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1)
    .map(cell => cell.trim());
}

export function parseDeployedAiBenchmark(markdown: string): AiBenchmark {
  const generatedAt = markdown.match(/^_Last updated: (.+)_$/m)?.[1];
  const gamesPerMatch = Number(markdown.match(/^- \*\*Games per match:\*\* (\d+)$/m)?.[1]);
  const lines = markdown.split('\n');
  const headerIndex = lines.findIndex(line => line.startsWith('| AI Type |'));

  if (!generatedAt || !Number.isInteger(gamesPerMatch) || headerIndex < 0) {
    throw new Error('Deployed AI benchmark is incomplete');
  }

  const ids = cells(lines[headerIndex]).slice(1);
  const opponents = ids.map(id => {
    const opponent = OPPONENT_LABELS[id];
    if (!opponent) throw new Error(`Unknown deployed AI: ${id}`);
    return { id, ...opponent };
  });
  const winRates: AiBenchmark['winRates'] = {};

  for (const line of lines.slice(headerIndex + 2, headerIndex + 2 + ids.length)) {
    const [rowId, ...values] = cells(line);
    if (!ids.includes(rowId) || values.length !== ids.length) {
      throw new Error('Deployed AI matrix is malformed');
    }

    winRates[rowId] = Object.fromEntries(
      ids.map((columnId, index) => {
        const rawValue = values[index];
        if (rawValue === '-') return [columnId, null];

        const value = Number(rawValue);
        if (!Number.isFinite(value) || value < 0 || value > 100) {
          throw new Error('Deployed AI matrix contains an invalid win rate');
        }
        return [columnId, value];
      })
    );
  }

  if (Object.keys(winRates).length !== ids.length) {
    throw new Error('Deployed AI matrix is incomplete');
  }

  return { generatedAt, gamesPerMatch, opponents, winRates };
}

export function benchmarkWinRate(benchmark: AiBenchmark, rowId: string, columnId: string): number {
  const value = benchmark.winRates[rowId]?.[columnId];
  if (value === null || value === undefined) throw new Error('Benchmark pairing is missing');
  return value;
}
