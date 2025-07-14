# Architecture Overview

This document details the architecture of the Royal Game of Ur project, focusing on its dual-AI engine, frontend, and deployment.

## Principles

- High performance: Rust and WebAssembly for AI
- Offline capability: Fully playable without internet
- Seamless UX: Switch between AIs with no difference in behavior
- Modern tooling: Next.js, TypeScript, serverless backend
- Maintainability: Clear separation of UI, logic, and AI

## Core Components

1. **Next.js Frontend**: React app for UI and game state
2. **Server-Side AI (Cloudflare Worker)**: Rust AI on Cloudflare edge
3. **Client-Side AI (WebAssembly)**: Same Rust AI logic compiled to Wasm for browser
4. **ML AI System (Experimental)**: See [ML AI System](./ml-ai-system.md)

The shared Rust AI core (`worker/rust_ai_core`) contains all game rules, evaluation, and expectiminimax search. Both AIs use this for identical strategy.

For AI algorithm details, see [AI System Documentation](./ai-system.md). For ML AI, see [ML AI System](./ml-ai-system.md).

### Frontend (`src/`)

- **UI Components**: `src/components/` (React, Tailwind, Framer Motion)
- **State Management**: `src/lib/game-store.ts` (Zustand + Immer)
- **Game Logic**: `src/lib/game-logic.ts` (pure functions)
- **AI Services**: `src/lib/ai-service.ts` (server), `src/lib/wasm-ai-service.ts` (client)
- **Database**: `src/lib/actions.ts` (save games)
- **Statistics**: `src/lib/stats-store.ts`

### Dual-AI Engine (`worker/`)

- **Server-Side AI**: Rust, `workers-rs`, exposes `/ai-move` endpoint
- **Client-Side AI**: Rust compiled to Wasm, loaded by frontend
- **Performance**: Server AI (4-ply, fast), Client AI (6-ply, strong)

### Data Flow: AI Turn

1. `RoyalGameOfUr.tsx` detects AI turn
2. Calls `makeAIMove` in `game-store.ts`
3. Calls appropriate AI service (client/server)
4. Chosen move processed by `makeMoveLogic`
5. UI updates

### Game Completion & Database

1. Game state set to finished
2. Local stats updated
3. `postGameToServer` action runs
4. Game saved to DB
5. Completion overlay shows stats

## Database

- **Local**: SQLite (`local.db`), Drizzle ORM
- **Production**: Cloudflare D1, Drizzle ORM
- **Schema**: See `src/lib/db/schema.ts`

## Deployment

- **Frontend**: Next.js on Cloudflare Pages
- **AI Worker**: Cloudflare Worker
- **Database**: Cloudflare D1
- **Automation**: GitHub Actions workflow

### WASM Security Headers

Set in `public/_headers`:

```
/wasm/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
```

## Development vs Production UI

- **Dev-only tools**: AI diagnostics, AI toggle, reset/test buttons (only on localhost)
- **Production**: Clean UI, client AI default

## Summary

- Modern, maintainable, high-performance architecture
- Dual AI (WASM and Worker) with shared Rust core
- Clear separation of concerns
- Full offline and online support
