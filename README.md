# 🏺 Royal Game of Ur - Cloudflare Edition

A modern implementation of the ancient Mesopotamian board game "Royal Game of Ur" built with Next.js, TypeScript, and powered by an intelligent AI written in Rust running on Cloudflare Workers.

## 🌟 Features

- **Authentic Gameplay**: Faithful recreation of the 4,500-year-old Royal Game of Ur
- **Advanced AI Opponent**: Intelligent AI powered by Rust using minimax algorithm with alpha-beta pruning and transposition tables
- **Modern UI**: Beautiful, responsive interface built with React, Tailwind CSS, and Framer Motion animations
- **Cloud-Native**: Deployed on Cloudflare Workers with static assets and AI running on Cloudflare Workers
- **Real-time**: Smooth animations and real-time game state updates with sound effects
- **Single Player Mode**: Challenge the sophisticated AI opponent

## 🎯 Game Rules

The Royal Game of Ur is a race game where each player tries to move all 7 pieces around the board and off the finish before their opponent.

### Key Rules:

- **Dice**: Roll 4 binary dice (tetrahedra). Count the marked corners (0-4 moves)
- **Movement**: Move pieces along your track from start to finish
- **Combat**: Land on opponent pieces to send them back to start (except on rosettes)
- **Rosettes**: Special starred squares are safe zones and grant extra turns
- **Winning**: First player to move all 7 pieces off the board wins

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Rust and Cargo (for AI development)
- Cloudflare account (for deployment)

### Development Setup

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd rgou-cloudflare
   npm install
   npm run setup:worker
   ```

2. **Start development servers:**

   ```bash
   # Terminal 1: Start Next.js app
   npm run dev

   # Terminal 2: Start AI worker
   npm run dev:worker
   ```

3. **Open your browser:**
   - Game: http://localhost:3000
   - AI Worker: http://localhost:8787

## 🏗️ Architecture

```
┌─────────────────┐    HTTP API    ┌──────────────────┐
│   Next.js App   │ ──────────────► │ Cloudflare Worker│
│   (Frontend)    │                 │   (AI Engine)    │
│                 │                 │                  │
│ • Game UI       │                 │ • Rust AI Logic  │
│ • Game Logic    │                 │ • Move Evaluation│
│ • State Mgmt    │                 │ • HTTP Endpoints │
│ • Sound Effects │                 │ • Transposition  │
└─────────────────┘                 └──────────────────┘
       │                                      │
       ▼                                      ▼
┌─────────────────┐                 ┌──────────────────┐
│ Cloudflare      │                 │ Cloudflare Workers│
│ Workers + Assets│                 │                  │
└─────────────────┘                 └──────────────────┘
```

## 🛠️ Development

### Project Structure

```
rgou-cloudflare/
├── src/
│   ├── app/                     # Next.js app router
│   │   ├── layout.tsx          # App layout
│   │   ├── page.tsx            # Main page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── RoyalGameOfUr.tsx   # Main game component
│   │   ├── GameBoard.tsx       # Board component
│   │   ├── GameControls.tsx    # Game controls UI
│   │   └── AnimatedBackground.tsx # Background effects
│   └── lib/                    # Utilities and logic
│       ├── types.ts            # TypeScript types
│       ├── game-logic.ts       # Core game logic
│       ├── ai-service.ts       # AI API client
│       ├── sound-effects.ts    # Audio system
│       └── utils.ts            # Utility functions
├── worker/                     # Cloudflare Worker (Rust)
│   ├── src/
│   │   └── lib.rs             # Rust AI implementation
│   ├── Cargo.toml             # Rust dependencies
│   ├── Cargo.lock             # Dependency lock
│   └── wrangler.toml          # Worker configuration
└── docs/                       # Documentation
    ├── cloudflare-worker.md   # Worker documentation
    └── minimax-ai-specification.md # AI specification
```

### Available Scripts

#### Main App

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:cf` - Build for Cloudflare Workers deployment
- `npm run deploy:cf` - Deploy to Cloudflare Workers
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

#### AI Worker

- `npm run dev:worker` - Start worker development server
- `npm run build:worker` - Build Rust worker
- `npm run deploy:worker` - Deploy worker to Cloudflare
- `npm run setup:worker` - Install worker dependencies

## 🤖 AI Implementation

The AI is implemented in Rust for maximum performance and compiled to WebAssembly for Cloudflare Workers. For detailed information about the worker implementation, see the [Cloudflare Worker Documentation](./docs/cloudflare-worker.md).

### AI Features:

- **Advanced Minimax Algorithm**: With alpha-beta pruning and transposition tables
- **Strategic Position Evaluation**: Multi-factor scoring based on piece positions, safety, and tactics
- **Mathematically Correct Dice Probabilities**: Proper Royal Game of Ur dice distribution
- **Adaptive Difficulty**: Sophisticated evaluation with depth-8 search
- **Performance Optimized**: 50-70% performance improvement with transposition tables
- **Fallback Logic**: TypeScript fallback when Rust AI is unavailable

### AI Evaluation Factors:

1. **Piece Advancement**: Reward pieces closer to finish
2. **Finished Pieces**: Heavily weight completed pieces
3. **Safety Considerations**: Value rosette positions and threat assessment
4. **Tactical Awareness**: Blocking, capturing, and tempo control
5. **Board Control**: Strategic positioning in shared sections
6. **Game Phase Recognition**: Adaptive strategy for opening/middle/endgame

## 🚀 Deployment

Deployment uses Cloudflare Workers with static assets for the frontend and a separate Cloudflare Worker for the AI backend. For detailed instructions, see the [Deployment Guide](./DEPLOYMENT.md).

### Environment Variables

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_AI_WORKER_URL=http://localhost:8787
```

For production, set in Cloudflare Workers environment variables:

```bash
NEXT_PUBLIC_AI_WORKER_URL=https://your-worker.your-subdomain.workers.dev
```

## 🎮 API Endpoints

The AI Worker exposes these endpoints:

### POST /ai-move

Get the best move for the current game state.

**Request:**

```json
{
  "player1Pieces": [{"square": -1}, ...],
  "player2Pieces": [{"square": -1}, ...],
  "currentPlayer": "player2",
  "diceRoll": 3
}
```

**Response:**

```json
{
  "move": 2,
  "evaluation": 150,
  "thinking": "Moving piece 2 to capture opponent...",
  "timings": {
    "aiMoveCalculation": 45,
    "totalHandlerTime": 52
  },
  "diagnostics": {
    "searchDepth": 8,
    "validMoves": [1, 2, 4],
    "moveEvaluations": [...],
    "transpositionHits": 234,
    "nodesEvaluated": 1245,
    "gamePhase": "Middlegame",
    "boardControl": 25
  }
}
```

### GET /health

Health check endpoint for monitoring.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## 🎵 Audio System

The game includes a comprehensive sound system:

- **Dice Rolling**: Authentic dice sound effects
- **Piece Movement**: Satisfying piece placement sounds
- **Captures**: Dramatic capture sound effects
- **Rosette Landing**: Special sound for landing on rosettes
- **Game End**: Victory and defeat sounds
- **AI Thinking**: Ambient thinking sounds

## 🎨 UI/UX Features

- **Animated Background**: Dynamic particle effects
- **Smooth Animations**: Framer Motion for fluid transitions
- **Responsive Design**: Mobile-first approach
- **Visual Effects**: Neon text effects and glowing elements
- **Move Feedback**: Visual and audio feedback for all interactions
- **Loading States**: Engaging AI thinking animations

## 🏆 Game Statistics

The AI provides detailed game analytics:

- **Move Evaluations**: Score and reasoning for each possible move
- **Search Diagnostics**: Nodes evaluated, transposition hits
- **Game Phase Detection**: Opening, middlegame, endgame recognition
- **Board Control Metrics**: Strategic positioning assessment
- **Performance Timings**: AI calculation and response times

## 🔧 Configuration

### Next.js Configuration

The project uses `open-next` for Cloudflare Workers compatibility:

```typescript
// next.config.mjs
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};
```

### Worker Configuration

```toml
# wrangler.toml
name = "rgou-main"
main = "worker.js"
compatibility_date = "2025-06-14"

[assets]
directory = "./out"
binding = "ASSETS"
```

## 🙏 Acknowledgements

- **Cloudflare** for their powerful Workers platform
- **Vercel** for their excellent Next.js tooling and inspiration
- The **Rust community** for outstanding WebAssembly support
- **Ancient Mesopotamians** for creating this timeless game

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📚 Historical Context

The Royal Game of Ur dates back to 2600-2400 BCE and was discovered in the Royal Cemetery at Ur by Sir Leonard Woolley. Game rules were deciphered from a cuneiform tablet by Irving Finkel at the British Museum.
