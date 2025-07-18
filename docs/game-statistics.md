# Game Statistics System

## Overview

The Royal Game of Ur includes a comprehensive statistics tracking system that records game outcomes and provides players with insights into their performance.

## Features

- **Win/Loss Tracking**: Automatic recording of game outcomes
- **Win Rate Calculation**: Percentage of games won
- **Local Storage**: Statistics persist across browser sessions
- **Database Integration**: Games are saved to database for analytics
- **Real-time Updates**: Statistics update immediately after game completion

## Implementation

### Local Statistics Store

Statistics are managed using Zustand with persistent storage:

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

### Database Schema

Games are automatically saved to the database upon completion:

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

### Game Completion Flow

1. **Game Ends**: When a player wins, `gameState.gameStatus` becomes 'finished'
2. **Statistics Update**: Local stats are incremented via `useStatsStore`
3. **Database Save**: Game data is posted to server via `saveGame` action
4. **UI Update**: Statistics panel shows updated win/loss counts

### Statistics Display

Statistics are shown in the game completion overlay:

```typescript
// src/components/game/GameCompletionOverlay.tsx
const gameStats = useGameStats();

<div className="text-center">
  <div className="text-2xl font-bold text-green-400">
    {gameStats.wins}
  </div>
  <div className="text-xs text-white/70">Wins</div>
  <div className="text-2xl font-bold text-pink-400">
    {gameStats.losses}
  </div>
  <div className="text-xs text-white/70">Losses</div>
  {gameStats.gamesPlayed > 0 && (
    <div className="mt-2 text-xs text-white/60">
      Win Rate: {Math.round((gameStats.wins / gameStats.gamesPlayed) * 100)}%
    </div>
  )}
</div>
```

## Data Flow

### Local Development

- Statistics stored in browser localStorage
- Games saved to local SQLite database (`local.db`)
- E2E tests verify database saves work correctly

### Production

- Statistics stored in browser localStorage
- Games saved to Cloudflare D1 database
- Automatic database migrations handle schema updates

## Testing

The statistics system is thoroughly tested:

- **Unit Tests**: `src/lib/__tests__/stats-store.test.ts`
- **E2E Tests**: Verify statistics update and database saves
- **Database Tests**: Ensure game data is properly saved

## Privacy

- **Player ID**: Generated using `nanoid()` for anonymous tracking
- **Local Storage**: Statistics remain on user's device
- **Database**: Only game outcomes and metadata are stored
- **No Personal Data**: No names, emails, or identifying information collected
