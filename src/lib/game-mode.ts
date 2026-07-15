import {
  OpponentModeSchema,
  type AISource,
  type OpponentMode,
  type Participant,
  type Player,
  type WatchMatchup,
  WatchMatchupSchema,
} from './schemas';

export type ModeConfiguration = {
  player1: AISource | null;
  player2: AISource;
  participants: readonly [Participant, Participant];
  watch: boolean;
};

export const DEFAULT_WATCH_MATCHUP: WatchMatchup = {
  player1: 'oracle',
  player2: 'classic',
};

const PLAY_MODE_CONFIGURATION = {
  heuristic: {
    player1: null,
    player2: 'heuristic',
    participants: ['human', 'heuristic'],
    watch: false,
  },
  classic: {
    player1: null,
    player2: 'classic',
    participants: ['human', 'classic'],
    watch: false,
  },
  ml: {
    player1: null,
    player2: 'ml',
    participants: ['human', 'ml'],
    watch: false,
  },
  oracle: {
    player1: null,
    player2: 'oracle',
    participants: ['human', 'oracle'],
    watch: false,
  },
} as const satisfies Record<Exclude<OpponentMode, 'watch'>, ModeConfiguration>;

export function getModeConfiguration(
  mode: OpponentMode,
  watchMatchup: WatchMatchup = DEFAULT_WATCH_MATCHUP
): ModeConfiguration {
  if (mode === 'watch') {
    return {
      ...watchMatchup,
      participants: [watchMatchup.player1, watchMatchup.player2],
      watch: true,
    };
  }

  return PLAY_MODE_CONFIGURATION[mode];
}

export function parseOpponentMode(value: unknown): OpponentMode | null {
  return OpponentModeSchema.safeParse(value).data ?? null;
}

export function parseWatchMatchup(value: unknown): WatchMatchup | null {
  return WatchMatchupSchema.safeParse(value).data ?? null;
}

export function getAISource(
  mode: OpponentMode,
  player: Player,
  watchMatchup?: WatchMatchup
): AISource | null {
  const configuration = getModeConfiguration(mode, watchMatchup);
  return player === 'player1' ? configuration.player1 : configuration.player2;
}

export function isAITurn(mode: OpponentMode, player: Player, watchMatchup?: WatchMatchup): boolean {
  return getAISource(mode, player, watchMatchup) !== null;
}
