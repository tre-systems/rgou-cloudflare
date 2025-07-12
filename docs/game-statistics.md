# Game Statistics Feature

## Overview

The Royal Game of Ur includes a comprehensive statistics tracking system that records player performance across all games. This feature provides players with insights into their gameplay history and performance metrics.

## Features

### Statistics Tracked

- **Wins**: Total number of games won by the player
- **Losses**: Total number of games lost to the AI
- **Games Played**: Total number of completed games
- **Win Rate**: Percentage of games won (calculated as wins / games played)

### Display

Statistics are prominently displayed in the game end panel when a game concludes. The panel shows:

- A celebratory message based on the game outcome
- Current win/loss record in a visually appealing format
- Win rate percentage (if games have been played)
- Animated entrance effects for enhanced user experience

## Technical Implementation

### Data Storage

Statistics are persisted using Zustand with localStorage:

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
      partialize: state => ({ stats: state.stats }),
    }
  )
);
```

### Integration with Game Logic

Statistics are automatically updated when games end:

```typescript
// src/lib/game-store.ts
if (newState.gameStatus === 'finished') {
  if (newState.winner === 'player1') {
    useStatsStore.getState().actions.incrementWins();
  } else {
    useStatsStore.getState().actions.incrementLosses();
  }
}
```

### UI Components

The statistics display is integrated into the GameBoard component:

```typescript
// src/components/GameBoard.tsx
const gameStats = useGameStats();

// Displayed in the game end panel
<motion.div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
  <div className="text-center">
    <h3 className="text-sm font-semibold text-white/90 mb-2">Your Record</h3>
    <div className="flex justify-center space-x-6">
      <div className="text-center">
        <div className="text-2xl font-bold text-green-400">{gameStats.wins}</div>
        <div className="text-xs text-white/70">Wins</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-pink-400">{gameStats.losses}</div>
        <div className="text-xs text-white/70">Losses</div>
      </div>
    </div>
    {gameStats.gamesPlayed > 0 && (
      <div className="mt-2 text-xs text-white/60">
        Win Rate: {Math.round((gameStats.wins / gameStats.gamesPlayed) * 100)}%
      </div>
    )}
  </div>
</motion.div>
```

## User Experience

### Visual Design

- **Color Coding**: Wins displayed in green, losses in pink
- **Typography**: Large, bold numbers for easy reading
- **Layout**: Clean, centered design with proper spacing
- **Animations**: Smooth entrance animations with staggered delays

### Accessibility

- High contrast colors for visibility
- Clear labeling of statistics
- Responsive design that works on all screen sizes

## Data Persistence

Statistics are automatically saved to the browser's localStorage and persist across:

- Browser sessions
- Page refreshes
- Application restarts

The data is stored in a structured format and can survive browser updates and cache clearing.

## Future Enhancements

Potential improvements to the statistics system:

- **Detailed Game History**: Track individual game details and moves
- **Performance Trends**: Show win rate over time
- **Achievement System**: Unlock achievements based on performance
- **Export Functionality**: Allow users to export their statistics
- **Cloud Sync**: Synchronize statistics across devices (requires backend integration)

## Testing

The statistics feature is thoroughly tested through:

- Unit tests for the stats store
- Integration tests with the game logic
- UI tests for the display components
- Manual testing of data persistence

## Performance Considerations

- Statistics updates are lightweight and don't impact game performance
- Local storage operations are asynchronous and non-blocking
- UI animations are optimized using Framer Motion
- Minimal memory footprint for storing statistics data
