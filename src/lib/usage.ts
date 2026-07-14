import { z } from 'zod';
import { getModeConfiguration } from './game-mode';
import { OpponentModeSchema, type GameState, type OpponentMode, type Player } from './types';

export const GameUsageModeSchema = OpponentModeSchema;
export type GameUsageMode = OpponentMode;

const ParticipantSchema = z.enum(['human', 'heuristic', 'classic', 'ml']);
const UsageContextSchema = z.object({
  mode: GameUsageModeSchema,
  player1: ParticipantSchema,
  player2: ParticipantSchema,
  startedBy: z.enum(['player1', 'player2']),
});

const UsageEventSchema = z.discriminatedUnion('event', [
  UsageContextSchema.extend({ event: z.literal('game_started') }).strict(),
  UsageContextSchema.extend({
    event: z.literal('game_completed'),
    winner: z.enum(['player1', 'player2']),
    moves: z.number().int().min(1).max(512),
    durationMs: z.number().int().min(0).max(86_400_000),
  }).strict(),
]);

export type UsageEvent = z.infer<typeof UsageEventSchema>;

function context(mode: GameUsageMode, startedBy: Player) {
  const [player1, player2] = getModeConfiguration(mode).participants;
  return { mode, player1, player2, startedBy };
}

export function gameStartedUsage(mode: GameUsageMode, startedBy: Player): UsageEvent {
  return { event: 'game_started', ...context(mode, startedBy) };
}

export function gameCompletedUsage(mode: GameUsageMode, state: GameState): UsageEvent {
  if (!state.winner) throw new Error('A completed game must have a winner');
  const durationMs = Math.min(
    86_400_000,
    Math.max(0, Date.now() - (state.startTime ?? Date.now()))
  );
  return {
    event: 'game_completed',
    ...context(mode, state.history[0]?.player ?? state.currentPlayer),
    winner: state.winner,
    moves: state.history.length,
    durationMs,
  };
}

export function parseUsageEvent(value: unknown): UsageEvent | null {
  return UsageEventSchema.safeParse(value).data ?? null;
}

export function usageDataPoint(event: UsageEvent) {
  return {
    indexes: ['rgou'],
    blobs: [
      event.event,
      event.mode,
      event.player1,
      event.player2,
      event.startedBy,
      event.event === 'game_completed' ? event.winner : '',
    ],
    doubles: [
      1,
      event.event === 'game_completed' ? event.moves : 0,
      event.event === 'game_completed' ? event.durationMs : 0,
    ],
  };
}

export function reportUsage(event: UsageEvent): void {
  const body = JSON.stringify(event);
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.sendBeacon === 'function' &&
    navigator.sendBeacon('/api/usage', new Blob([body], { type: 'application/json' }))
  ) {
    return;
  }

  if (typeof fetch === 'function') {
    void fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }
}
