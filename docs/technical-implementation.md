# Technical Implementation Guide

## Development Environment Setup

### Prerequisites

- **Node.js 18+**: JavaScript runtime
- **Rust 1.70+**: Systems programming language for AI
- **wasm-pack**: WebAssembly build tool
- **worker-build**: Cloudflare Workers build tool
- **SQLite**: Local database (usually pre-installed)

### Installation Commands

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack for WebAssembly compilation
cargo install wasm-pack

# Install worker-build for Cloudflare Workers
cargo install worker-build

# Install Node.js dependencies
npm install
```

## Project Structure

```
rgou-cloudflare/
├── src/                          # Next.js frontend application
│   ├── app/                      # App Router pages
│   ├── components/               # React components
│   └── lib/                      # Shared utilities and services
├── worker/                       # Rust backend and AI
│   ├── rust_ai_core/            # Shared AI logic
│   └── src/                     # Worker entry point
├── docs/                        # Documentation
├── migrations/                  # Database schema migrations
└── public/                      # Static assets
```

## Build Process

### Frontend Build

The frontend uses Next.js with the Cloudflare Pages adapter:

```bash
# Development
npm run dev

# Production build
npm run build
```

### PostCSS Configuration

The PostCSS configuration is environment-aware and automatically adjusts based on the current environment:

- **Development/Production**: Uses `@tailwindcss/postcss` for Tailwind CSS processing
- **Test Environment**: Uses an empty plugins array to avoid CSS processing during tests

```javascript
// postcss.config.mjs
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST;

const config = {
  plugins: isTest ? [] : ['@tailwindcss/postcss'],
};

export default config;
```

### AI Build Process

The AI system has multiple build targets:

#### 1. WebAssembly (Client AI)

```bash
# Build WASM module
cd worker/rust_ai_core
wasm-pack build --target web --out-dir ../../public/wasm
```

#### 2. Cloudflare Worker (Server AI)

```bash
# Build worker
cd worker
worker-build --release
```

### Database Migrations

```bash
# Local development
npm run migrate:local

# Production (D1)
npm run migrate:d1
```

## AI Implementation Details

### Core AI Module (`worker/rust_ai_core/src/lib.rs`)

The core AI logic is implemented in Rust with the following key components:

#### Game State Representation

```rust
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GameState {
    pub board: Vec<Option<PiecePosition>>,
    pub player1_pieces: Vec<PiecePosition>,
    pub player2_pieces: Vec<PiecePosition>,
    pub current_player: Player,
    pub dice_roll: u8,
}
```

#### Board Layout Constants

```rust
const ROSETTE_SQUARES: [u8; 5] = [0, 7, 13, 15, 16];
const PLAYER1_TRACK: [u8; 14] = [3, 2, 1, 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const PLAYER2_TRACK: [u8; 14] = [19, 18, 17, 16, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15];
```

### WebAssembly Integration

#### WASM API (`worker/rust_ai_core/src/wasm_api.rs`)

The WebAssembly interface provides:

```rust
#[wasm_bindgen]
pub fn get_ai_move_wasm(game_state_request_js: JsValue) -> Result<JsValue, JsValue>
```

#### Frontend Integration (`src/lib/wasm-ai-service.ts`)

```typescript
export class WasmAiService {
  private wasmModule: any = null;

  async initialize(): Promise<void> {
    this.wasmModule = await import('/wasm/rgou_ai_core.js');
  }

  async getAIMove(gameState: GameState): Promise<AIResponse> {
    const request = this.convertGameStateToRequest(gameState);
    const response = this.wasmModule.get_ai_move_wasm(request);
    return JSON.parse(response);
  }
}
```

### Cloudflare Worker Implementation

#### Worker Entry Point (`worker/src/lib.rs`)

```rust
#[event(fetch)]
async fn main(req: Request, env: Env, _ctx: worker::Context) -> Result<Response> {
    let router = Router::new();

    router
        .post_async("/ai-move", |req, ctx| handle_ai_move(req, ctx))
        .get("/health", |_req, _ctx| handle_health())
        .run(req, env)
        .await
}
```

## Database Implementation

### Schema (`src/lib/db/schema.ts`)

```typescript
export const games = sqliteTable('games', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => nanoid()),
  playerId: text('playerId').notNull(),
  clientVersion: text('clientVersion').notNull().default('unknown'),
  winner: text('winner', { enum: ['player1', 'player2'] }),
  completedAt: integer('completedAt', { mode: 'timestamp_ms' }),
  status: text('status', { enum: ['in_progress', 'completed', 'abandoned'] })
    .notNull()
    .default('in_progress'),
  moveCount: integer('moveCount'),
  duration: integer('duration'),
  version: text('version').notNull().default('1.0.0'),
  clientHeader: text('clientHeader'),
  history: text('history', { mode: 'json' }),
});
```

### Database Connection (`src/lib/db/index.ts`)

The application supports both local SQLite and production D1 databases:

```typescript
export const getDb = async () => {
  if (process.env.NODE_ENV === 'production') {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext({ async: true });
    return drizzleD1(env.DB, { schema });
  } else {
    const sqlite = new Database('local.db');
    return drizzleSqlite(sqlite, { schema });
  }
};
```

### Game Saving (`src/lib/actions.ts`)

Games are automatically saved upon completion:

```typescript
export async function saveGame(payload: SaveGamePayload) {
  const db = await getDb();
  const validation = SaveGamePayloadSchema.safeParse(payload);

  if (!validation.success) {
    return { error: 'Invalid game data' };
  }

  const [newGame] = await db
    .insert(games)
    .values({
      winner: payload.winner,
      playerId: payload.playerId,
      status: 'completed',
      completedAt: new Date(),
      history: payload.history,
      // ... other fields
    })
    .returning();

  return { success: true, gameId: newGame?.id };
}
```

## State Management

### Game Store (`src/lib/game-store.ts`)

Uses Zustand with Immer for immutable state updates:

```typescript
export const useGameStore = create<GameStore>()(
  persist(
    immer((set, get) => ({
      gameState: initialGameState,
      actions: {
        makeMove: (pieceIndex: number) => {
          set(state => {
            const newState = makeMoveLogic(state.gameState, pieceIndex);
            state.gameState = newState;
          });
        },
        postGameToServer: async () => {
          const { gameState } = get();
          if (gameState.gameStatus === 'finished' && gameState.winner) {
            await saveGame({
              winner: gameState.winner,
              history: gameState.history,
              playerId: getPlayerId(),
              // ... other fields
            });
          }
        },
      },
    }))
  )
);
```

### Statistics Store (`src/lib/stats-store.ts`)

Local statistics are managed with persistent storage:

```typescript
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
          const { stats } = get();
          set({
            stats: {
              ...stats,
              wins: stats.wins + 1,
              gamesPlayed: stats.gamesPlayed + 1,
            },
          });
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

## Testing Strategy

### Rust Tests

```bash
# Run all Rust tests
cd worker/rust_ai_core
cargo test

# Run AI simulation tests
cargo test --test ai_simulation
```

### Frontend Tests

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run all tests (including Rust)
npm run check
```

### E2E Testing

E2E tests verify complete game workflows:

```typescript
// e2e/smoke.spec.ts
test('simulate win and verify game is saved and stats panel updates', async ({ page }) => {
  await page.goto('/');
  if (process.env.NODE_ENV === 'development') {
    await page.getByTestId('create-near-winning-state').click();
    await page.getByTestId('roll-dice').click();
    await page.waitForTimeout(500);
    const squares = page.locator('[data-testid^="square-"]');
    await squares.nth(12).click();
    await expect(page.locator('text=Victory!')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('wins-count')).toHaveText('1');

    // Verify database save
    const db = new Database('local.db');
    const row = db
      .prepare('SELECT * FROM games WHERE winner = ? ORDER BY completedAt DESC LIMIT 1')
      .get('player1');
    expect(row).toBeTruthy();
    db.close();
  }
});
```

## Deployment

### Cloudflare Pages

The application is deployed to Cloudflare Pages using OpenNext:

```bash
# Build for Cloudflare
npm run build

# Deploy
npx wrangler deploy
```

### WASM Security Headers

Required headers for WASM loading:

```
/wasm/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
```

### GitHub Actions

Automated deployment workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: actions/setup-rust@v1
      - run: npm run check # Run all tests
      - run: npm run build # Build application
      - uses: cloudflare/wrangler-action@v3
```

## Development vs Production

### Development Features

- **AI Diagnostics Panel**: Real-time AI analysis
- **AI Toggle**: Switch between client/server AI
- **Reset Game**: Restart current game
- **Test End Game**: Create near-winning state for testing

### Production Features

- **Client AI Only**: Default to WASM AI for better performance
- **Database Integration**: Automatic game saving
- **Statistics Tracking**: Win/loss tracking with local storage
- **PWA Support**: Installable with offline capability
