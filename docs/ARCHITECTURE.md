# Architecture

The Royal Game of Ur runs as a Next.js app with its AI engine compiled from Rust to WebAssembly. All AI executes client-side in Web Workers, so the game plays fully offline with no server round-trips.

## Principles

- **High performance** — Rust and WebAssembly for AI search and inference
- **Offline-first** — fully playable without a network connection
- **Clear separation** — UI, game logic, and AI are independent layers

## Frontend (`src/`)

- **UI components**: `src/components/` (React, Tailwind, Framer Motion); `RoyalGameOfUr.tsx` is the root
- **State**: `src/lib/game-store.ts` (Zustand + Immer)
- **Game logic**: `src/lib/game-logic.ts` (pure functions: `getValidMoves`, `makeMove`, `processDiceRoll`)
- **AI services**: `src/lib/wasm-ai-service.ts` (Classic AI), `src/lib/ml-ai-service.ts` (ML AI)
- **Statistics**: `src/lib/stats-store.ts`
- **Persistence**: `src/lib/actions.ts` (`saveGame`)

## AI engine

Both AIs are Rust, compiled to WebAssembly and run in Web Workers so search never blocks the UI:

- **Classic AI** — expectiminimax with alpha-beta pruning
- **ML AI** — value + policy neural network

See [AI-SYSTEM.md](./AI-SYSTEM.md) for the algorithms and models. Core: `worker/rust_ai_core/src/lib.rs`; WASM bindings: `worker/rust_ai_core/src/wasm_api.rs`.

## Data flow

**AI turn**: `RoyalGameOfUr.tsx` detects an AI turn → `makeAIMove` in `game-store.ts` → the relevant AI service → the chosen move is applied by `makeMove` → UI updates.

**Game completion**: state is set to finished → local stats update → `postGameToServer` calls the `saveGame` action → the game is written idempotently to the database using its client-generated game ID → the completion overlay shows stats.

## Database

Drizzle ORM over SQLite locally (`local.db`, `npm run db:setup`) and Cloudflare D1 in production (`npm run migrate:d1`).

```typescript
// src/lib/db/schema.ts
export const games = sqliteTable('games', {
  id: text('id').primaryKey(),
  playerId: text('playerId').notNull(),
  winner: text('winner', { enum: ['player1', 'player2'] }),
  completedAt: integer('completedAt', { mode: 'timestamp_ms' }),
  moveCount: integer('moveCount'),
  duration: integer('duration'),
  clientHeader: text('clientHeader'),
  history: text('history', { mode: 'json' }),
  gameType: text('gameType', { enum: ['classic', 'ml', 'watch', 'heuristic'] })
    .notNull()
    .default('classic'),
});
```

Players are identified by an anonymous local ID. In-progress games and player settings are validated and restored from local storage. Win/loss statistics update immediately on completion, exclude AI-vs-AI watch matches, and are also saved to the database for analytics.

## Deployment

The app deploys to **Cloudflare Workers** via [OpenNext](https://opennext.js.org/cloudflare). GitHub Actions (`.github/workflows/deploy.yml`) runs `npm run check`, builds with `npm run build:cf`, and deploys with Wrangler. Configuration lives in `wrangler.toml`; the canonical production site is `https://gameofur.org`, with `www.gameofur.org`, `gameofur.net`, `www.gameofur.net`, and `rgou.tre.systems` routed to the same Worker.

The app does not use Next.js incremental regeneration, so OpenNext uses its default in-process/dummy cache configuration and requires no R2 binding. Static PWA and WebAssembly assets are served by the Worker assets binding.

WASM requires cross-origin isolation headers, set in `public/_headers`:

```
/wasm/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
```

## Inactive server worker

`worker/src/lib.rs` contains a standalone Rust HTTP worker exposing `POST /ai-move` and `GET /health` for server-side AI. It is not part of the deployment — the app runs AI client-side — but is kept for potential future use such as multiplayer validation or analytics.

## Development vs production

- **Development** (localhost only): AI diagnostics panel, AI toggle, and reset/test controls; local SQLite database.
- **Production**: clean UI with no dev tools; Classic AI as the default opponent; Cloudflare D1; optimized builds.
