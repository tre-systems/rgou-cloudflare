import {
  OpponentModeSchema,
  type AISource,
  type OpponentMode,
  type Participant,
  type Player,
} from './schemas';

export type ModeConfiguration = {
  player1: AISource | null;
  player2: AISource;
  participants: readonly [Participant, Participant];
  watch: boolean;
};

const MODE_CONFIGURATION = {
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
  watch: {
    player1: 'classic',
    player2: 'ml',
    participants: ['classic', 'ml'],
    watch: true,
  },
} as const satisfies Record<OpponentMode, ModeConfiguration>;

export function getModeConfiguration(mode: OpponentMode): ModeConfiguration {
  return MODE_CONFIGURATION[mode];
}

export function parseOpponentMode(value: unknown): OpponentMode | null {
  return OpponentModeSchema.safeParse(value).data ?? null;
}

export function getAISource(mode: OpponentMode, player: Player): AISource | null {
  const configuration = getModeConfiguration(mode);
  return player === 'player1' ? configuration.player1 : configuration.player2;
}

export function isAITurn(mode: OpponentMode, player: Player): boolean {
  return getAISource(mode, player) !== null;
}
