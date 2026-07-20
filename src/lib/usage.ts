import { z } from 'zod';
import { getModeConfiguration } from './game-mode';
import {
  MAX_GAME_HISTORY,
  OpponentModeSchema,
  ParticipantSchema,
  type GameState,
  type OpponentMode,
  type Player,
  type WatchMatchup,
} from './types';

export const GameUsageModeSchema = OpponentModeSchema;
export type GameUsageMode = OpponentMode;
const AnonymousIdSchema = z.string().uuid();
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const DEVICE_ID_KEY = 'rgou-analytics-device';
const SESSION_KEY = 'rgou-analytics-session';
const OPT_OUT_KEY = 'rgou-analytics-optout';
const AUTOMATED_USER_AGENT =
  /bot|crawler|spider|headlesschrome|lighthouse|pagespeed|claude|electron/i;

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
    moves: z.number().int().min(0).max(MAX_GAME_HISTORY),
    durationMs: z.number().int().min(0).max(86_400_000),
  }).strict(),
]);

export type UsageEvent = z.infer<typeof UsageEventSchema>;
export type UsagePayload = UsageEvent & { deviceId: string; sessionId: string };
type GameStartedUsageEvent = Extract<UsageEvent, { event: 'game_started' }>;
type GameCompletedUsageEvent = Extract<UsageEvent, { event: 'game_completed' }>;
const UsagePayloadSchema = z
  .object({ deviceId: AnonymousIdSchema, sessionId: AnonymousIdSchema })
  .passthrough()
  .superRefine((value, context) => {
    const event = Object.fromEntries(
      Object.entries(value).filter(([key]) => key !== 'deviceId' && key !== 'sessionId')
    );
    if (!UsageEventSchema.safeParse(event).success) {
      context.addIssue({ code: 'custom', message: 'Invalid usage event' });
    }
  })
  .transform(value => value as UsagePayload);

function context(mode: GameUsageMode, startedBy: Player, watchMatchup?: WatchMatchup) {
  const [player1, player2] = getModeConfiguration(mode, watchMatchup).participants;
  return { mode, player1, player2, startedBy };
}

export function gameStartedUsage(
  mode: GameUsageMode,
  startedBy: Player,
  watchMatchup?: WatchMatchup
): GameStartedUsageEvent {
  return { event: 'game_started', ...context(mode, startedBy, watchMatchup) };
}

export function gameCompletedUsage(
  mode: GameUsageMode,
  state: GameState,
  startedBy: Player = state.history[0]?.player ?? state.currentPlayer,
  watchMatchup?: WatchMatchup
): GameCompletedUsageEvent {
  if (!state.winner) throw new Error('A completed game must have a winner');
  const durationMs = Math.min(
    86_400_000,
    Math.max(0, Date.now() - (state.startTime ?? Date.now()))
  );
  return {
    event: 'game_completed',
    ...context(mode, startedBy, watchMatchup),
    winner: state.winner,
    moves: Math.min(MAX_GAME_HISTORY, state.history.length),
    durationMs,
  };
}

export function parseUsageEvent(value: unknown): UsageEvent | null {
  return UsageEventSchema.safeParse(value).data ?? null;
}

export function parseUsagePayload(value: unknown): UsagePayload | null {
  return UsagePayloadSchema.safeParse(value).data ?? null;
}

export function usageDataPoint(event: UsagePayload) {
  return {
    indexes: ['rgou'],
    blobs: [
      event.event,
      event.mode,
      event.player1,
      event.player2,
      event.startedBy,
      event.event === 'game_completed' ? event.winner : '',
      event.deviceId,
      event.sessionId,
      '2',
    ],
    doubles: [
      1,
      event.event === 'game_completed' ? event.moves : 0,
      event.event === 'game_completed' ? event.durationMs : 0,
    ],
  };
}

function analyticsEnabled(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  try {
    const preference = new URLSearchParams(window.location.search).get('telemetry');
    if (preference === 'off') localStorage.setItem(OPT_OUT_KEY, '1');
    if (preference === 'on') localStorage.removeItem(OPT_OUT_KEY);
    return (
      localStorage.getItem(OPT_OUT_KEY) !== '1' &&
      !navigator.webdriver &&
      !AUTOMATED_USER_AGENT.test(navigator.userAgent)
    );
  } catch {
    return false;
  }
}

function anonymousId(key: string): string {
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

function currentSessionId(): string {
  const now = Date.now();
  const stored = localStorage.getItem(SESSION_KEY);
  const session = stored
    ? (JSON.parse(stored) as { id?: unknown; lastSeenAt?: unknown })
    : undefined;
  const id =
    typeof session?.id === 'string' &&
    typeof session.lastSeenAt === 'number' &&
    now - session.lastSeenAt < SESSION_TIMEOUT_MS
      ? session.id
      : crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id, lastSeenAt: now }));
  return id;
}

export function reportUsage(event: UsageEvent): void {
  if (!analyticsEnabled()) return;

  let body: string;
  try {
    body = JSON.stringify({
      ...event,
      deviceId: anonymousId(DEVICE_ID_KEY),
      sessionId: currentSessionId(),
    } satisfies UsagePayload);
  } catch {
    return;
  }
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
