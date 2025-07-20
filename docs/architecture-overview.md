# Architecture Overview

This document details the architecture of the Royal Game of Ur project, focusing on its AI engine, frontend, and deployment.

## What Makes This Special?

This implementation stands out for several reasons:

- **Ancient Game, Modern Tech**: Brings a 4500-year-old game to life with cutting-edge web technologies
- **Dual AI System**: Features both a classic expectiminimax AI and a neural network AI, each with distinct playstyles
- **Browser-Native AI**: All AI runs locally in your browser via WebAssembly - no server calls needed
- **Offline-First**: Works completely offline once loaded, perfect for mobile or unreliable connections
- **Performance**: Rust-compiled AI provides desktop-level performance in the browser
- **Evolutionary Architecture**: Successfully migrated from hybrid client/server AI to pure client-side execution

## Principles

- High performance: Rust and WebAssembly for AI
- Offline capability: Fully playable without internet
- Seamless UX: Modern, responsive UI
- Maintainability: Clear separation of UI, logic, and AI

## Core Components

1. **Next.js Frontend**: React app for UI and game state
2. **AI (WebAssembly)**: Rust AI logic compiled to Wasm for browser (Classic AI and ML AI)
3. **Database**: Cloudflare D1, Drizzle ORM

The shared Rust AI core (`worker/rust_ai_core`) contains all game rules, evaluation, and expectiminimax search. Both Classic AI and ML AI use this for identical strategy, running locally in the browser.

For AI algorithm details, see [AI System](./ai-system.md). For ML AI, see [ML System Overview](./ml-system-overview.md).

### Frontend (`src/`)

- **UI Components**: `src/components/` (React, Tailwind, Framer Motion)
- **State Management**: `src/lib/game-store.ts` (Zustand + Immer)
- **Game Logic**: `src/lib/game-logic.ts` (pure functions)
- **AI Services**: `src/lib/wasm-ai-service.ts` (Classic AI), `src/lib/ml-ai-service.ts` (ML AI)
- **Database**: `src/lib/actions.ts` (save games)
- **Statistics**: `src/lib/stats-store.ts`

### AI Engine

- **Classic AI**: Rust, expectiminimax, compiled to WebAssembly
- **ML AI**: Rust, neural network, compiled to WebAssembly
- **Performance**: All AI runs locally in the browser (no server calls)
- **Architecture**: Pure client-side execution via Web Workers

### WASM Architecture Evolution

The project has evolved from a hybrid client/server architecture to a pure client-side implementation:

**Original Design (Early Development)**:

- AI computation could run on either client (WASM) or server (Cloudflare Worker)
- Server-side AI provided backup and potential performance benefits
- More complex deployment and infrastructure requirements

**Current Design (Production)**:

- All AI computation runs client-side via WebAssembly workers
- Eliminates network latency and server infrastructure costs
- Enables true offline play without server dependencies
- Simplified deployment and reduced attack surface

**Preserved Infrastructure**:

- Cloudflare Worker code remains in `worker/src/lib.rs` for potential future use
- Server-side AI endpoints (`/ai-move`, `/health`) are inactive but available
- Architecture supports easy reactivation if server-side features are needed

### Data Flow: AI Turn

1. `RoyalGameOfUr.tsx` detects AI turn
2. Calls `makeAIMove` in `game-store.ts`
3. Calls appropriate AI service (Classic AI or ML AI)
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

### Game Statistics

The game includes comprehensive statistics tracking that records game outcomes and provides performance insights.

#### Features

- **Win/Loss Tracking**: Automatic recording of game outcomes
- **Win Rate Calculation**: Percentage of games won
- **Local Storage**: Statistics persist across browser sessions
- **Database Integration**: Games saved to database for analytics
- **Real-time Updates**: Statistics update immediately after game completion

#### Implementation

**Local Statistics Store**:

Statistics managed using Zustand with persistent storage:

```typescript
// src/lib/stats-store.ts
export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      stats: {
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
      },
      actions: {
        incrementWins: () => {
          /* ... */
        },
        incrementLosses: () => {
          /* ... */
        },
      },
    }),
    {
      name: 'rgou-stats-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

**Database Schema**:

Games automatically saved to database upon completion:

```typescript
// src/lib/db/schema.ts
export const games = sqliteTable('games', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  playerId: text('playerId').notNull(),
  winner: text('winner', { enum: ['player1', 'player2'] }),
  completedAt: integer('completedAt', { mode: 'timestamp_ms' }),
  moveCount: integer('moveCount'),
  duration: integer('duration'),
  history: text('history', { mode: 'json' }),
  gameType: text('gameType', { enum: ['classic', 'ml', 'watch'] }),
});
```

#### Data Flow

**Game Completion Flow**:

1. **Game Ends**: `gameState.gameStatus` becomes 'finished'
2. **Statistics Update**: Local stats incremented via `useStatsStore`
3. **Database Save**: Game data posted to server via `saveGame` action
4. **UI Update**: Statistics panel shows updated win/loss counts

**Environment Handling**:

- **Local Development**: SQLite database (`local.db`)
- **Production**: Cloudflare D1 database
- **Testing**: E2E tests verify database saves work correctly

#### Privacy

- **Player ID**: Generated using `nanoid()` for anonymous tracking
- **Local Storage**: Statistics remain on user's device
- **Database**: Only game outcomes and metadata stored
- **No Personal Data**: No names, emails, or identifying information

## Deployment

- **Frontend**: Next.js on Cloudflare Pages
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
- **Production**: Clean UI, Classic AI default

## Summary

- Modern, maintainable, high-performance architecture
- All AI runs locally in the browser (WASM)
- Clear separation of concerns
- Full offline and online support
- Comprehensive statistics tracking
- Privacy-focused data collection
