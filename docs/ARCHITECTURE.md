# Architecture

The Royal Game of Ur is a Vite-built React SPA served by a small Cloudflare Worker, with its AI engine compiled from Rust to WebAssembly. All AI executes client-side in Web Workers, so gameplay has no server round-trips and remains available offline.

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
- **Usage analytics**: `src/lib/usage.ts` and the validated `/api/usage` route in `src/worker.ts`

## AI engine

Both AIs are Rust, compiled to WebAssembly and run in Web Workers so search never blocks the UI:

- **Classic AI** — expectiminimax with alpha-beta pruning
- **ML AI** — value + policy neural network

See [AI-SYSTEM.md](./AI-SYSTEM.md) for the algorithms and models. Core: `worker/rust_ai_core/src/lib.rs`; WASM bindings: `worker/rust_ai_core/src/wasm_api.rs`.

## Data flow

**AI turn**: `RoyalGameOfUr.tsx` detects an AI turn → `makeAIMove` in `game-store.ts` → the relevant AI service → the chosen move is applied by `makeMove` → UI updates.

**Game completion**: state is set to finished → local stats update → the completion overlay shows stats → one best-effort anonymous `game_completed` event is sent to the Worker.

## Persistence and analytics

In-progress games, settings, and personal win/loss statistics are validated and stored only in browser local storage. Watch-mode matches are excluded from personal statistics.

The app has no database. It reports only `game_started` and `game_completed` lifecycle events to the shared account-level Analytics Engine dataset `app_usage`, indexed by `rgou`. Events contain mode, anonymous participant categories, starting side, and—on completion—winner, move count, and duration. They do not contain a player identifier, user agent, board state, or move history. The Worker accepts only small, strict, same-origin JSON payloads. Analytics are best-effort and never block the game.

## Deployment

The app deploys as a Cloudflare Worker with Static Assets through the Cloudflare Vite plugin. GitHub Actions runs `npm run check`, builds with Vite, deploys the generated Wrangler configuration, and smoke-tests production. Configuration lives in `wrangler.toml`; the canonical production site is `https://gameofur.org`. The Worker permanently redirects `www.gameofur.org`, `gameofur.net`, `www.gameofur.net`, and `rgou.tre.systems` while preserving path and query.

The Worker owns the `/api/usage` route and delegates all other requests to Static Assets with SPA fallback. No D1 or R2 binding is required.

WASM requires cross-origin isolation headers, set in `public/_headers`:

```
/wasm/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
```

## Inactive server worker

The Rust crate also exposes native binaries used for training and evaluation. They are not part of the web deployment.

## Development vs production

- **Development** (localhost only): AI diagnostics panel, AI toggle, and reset/test controls.
- **Production**: clean UI with no dev tools, optimized assets, canonical redirects, and best-effort Analytics Engine usage counters.
