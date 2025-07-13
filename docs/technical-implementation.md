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
│   ├── rgou-ai-worker/          # Cloudflare Worker
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
export const gameStats = pgTable('game_stats', {
  id: serial('id').primaryKey(),
  playerWins: integer('player_wins').notNull().default(0),
  playerLosses: integer('player_losses').notNull().default(0),
  gamesPlayed: integer('games_played').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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

## State Management

### Game Store (`src/lib/game-store.ts`)

Uses Zustand with Immer for immutable state updates:

```typescript
export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    gameState: initialGameState,
    actions: {
      makeMove: (pieceIndex: number) => {
        set(state => {
          const newState = makeMoveLogic(state.gameState, pieceIndex);
          state.gameState = newState;
        });
      },
      makeAIMove: async (aiSource: 'server' | 'client') => {
        // AI move implementation
      },
    },
  }))
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
# Run TypeScript type checking
npm run type-check

# Run linting
npm run lint

# Run all checks
npm run check
```

### AI Performance Testing

The project includes AI vs AI simulation tests to validate performance:

```rust
#[test]
fn test_ai_performance() {
    let mut ai1 = AI::new();
    let mut ai2 = AI::new();

    for _ in 0..NUM_GAMES {
        let winner = play_game(&mut ai1, &mut ai2);
        // Validate game completion and winner determination
    }
}
```

## Performance Optimization

### WebAssembly Optimization

- **Size optimization**: WASM module is ~500KB
- **Memory management**: Efficient Rust memory model
- **Caching**: Transposition tables for position caching

### Frontend Optimization

- **Code splitting**: Dynamic imports for WASM modules
- **Lazy loading**: AI diagnostics only in development
- **Service worker**: Offline caching and PWA support

### Database Optimization

- **Connection pooling**: Efficient database connections
- **Indexing**: Optimized queries for statistics
- **Caching**: Local storage for game statistics

## Security Considerations

### WebAssembly Security

- **CORS headers**: Proper cross-origin resource policy
- **Content Security Policy**: Restricted WASM loading
- **Sandboxing**: Browser-enforced security isolation

### API Security

- **CORS configuration**: Restricted origins
- **Rate limiting**: Cloudflare Workers rate limiting
- **Input validation**: Zod schema validation

## Deployment Pipeline

### GitHub Actions Workflow

```yaml
name: Deploy to Cloudflare
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
      - name: Build and Deploy
        run: |
          npm install
          npm run build
          npx wrangler deploy
```

### Environment Configuration

```bash
# Development
NODE_ENV=development
DATABASE_URL=file:local.db

# Production
NODE_ENV=production
CLOUDFLARE_ACCOUNT_ID=your_account_id
D1_DATABASE_ID=your_database_id
```

## Monitoring and Debugging

### Development Tools

- **AI Diagnostics Panel**: Real-time AI analysis (development only)
- **Console Logging**: Detailed AI move analysis
- **Performance Timing**: Move calculation timing

### Production Monitoring

- **Cloudflare Analytics**: Request metrics and performance
- **Error Tracking**: Worker error logging
- **Performance Monitoring**: Response time tracking

## Troubleshooting

### Common Issues

1. **WASM Loading Failures**
   - Check CORS headers in `public/_headers`
   - Verify WASM file paths
   - Ensure proper MIME types

2. **Database Connection Issues**
   - Verify environment variables
   - Check D1 database permissions
   - Validate schema migrations

3. **AI Performance Issues**
   - Monitor search depth settings
   - Check transposition table size
   - Verify memory usage

### Debug Commands

```bash
# Check WASM build
wasm-pack build --target web --out-dir public/wasm

# Test worker locally
wrangler dev

# Validate database schema
npm run migrate:local

# Check TypeScript types
npm run type-check
```
