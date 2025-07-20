# Game Statistics

_Statistics tracking and database integration for the Royal Game of Ur._

## Overview

The game includes comprehensive statistics tracking that records game outcomes and provides performance insights.

## Features

- **Win/Loss Tracking**: Automatic recording of game outcomes
- **Win Rate Calculation**: Percentage of games won
- **Local Storage**: Statistics persist across browser sessions
- **Database Integration**: Games saved to database for analytics
- **Real-time Updates**: Statistics update immediately after game completion

## Implementation

### Local Statistics Store

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

### Database Schema

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

## Data Flow

### Game Completion Flow

1. **Game Ends**: `gameState.gameStatus` becomes 'finished'
2. **Statistics Update**: Local stats incremented via `useStatsStore`
3. **Database Save**: Game data posted to server via `saveGame` action
4. **UI Update**: Statistics panel shows updated win/loss counts

### Environment Handling

- **Local Development**: SQLite database (`local.db`)
- **Production**: Cloudflare D1 database
- **Testing**: E2E tests verify database saves work correctly

## Privacy

- **Player ID**: Generated using `nanoid()` for anonymous tracking
- **Local Storage**: Statistics remain on user's device
- **Database**: Only game outcomes and metadata stored
- **No Personal Data**: No names, emails, or identifying information

## Testing

- **Unit Tests**: `src/lib/__tests__/stats-store.test.ts`
- **E2E Tests**: Verify statistics update and database saves
- **Database Tests**: Ensure game data properly saved

## Related Documentation

- [Architecture Overview](./architecture-overview.md) - System design
- [Testing Strategy](./testing-strategy.md) - Testing approach
