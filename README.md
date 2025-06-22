# 🏺 Royal Game of Ur - Cloudflare Edition

A modern implementation of the ancient Mesopotamian board game "Royal Game of Ur" built with Next.js, TypeScript, and powered by AI written in Zig running on Cloudflare Workers.

## 🌟 Features

- **Authentic Gameplay**: Faithful recreation of the 4,500-year-old Royal Game of Ur
- **AI Opponent**: Intelligent AI powered by Zig using minimax algorithm with alpha-beta pruning
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **Cloud-Native**: Deployed on Cloudflare Pages with AI running on Cloudflare Workers
- **Real-time**: Smooth animations and real-time game state updates
- **Two Game Modes**: Play against another human or challenge the AI

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
- Zig compiler (for AI development)
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
│ • Game UI       │                 │ • Zig AI Logic   │
│ • Game Logic    │                 │ • Move Evaluation│
│ • State Mgmt    │                 │ • HTTP Endpoints │
└─────────────────┘                 └──────────────────┘
       │                                      │
       ▼                                      ▼
┌─────────────────┐                 ┌──────────────────┐
│ Cloudflare Pages│                 │ Cloudflare Workers│
└─────────────────┘                 └──────────────────┘
```

## 🛠️ Development

### Project Structure

```
rgou-cloudflare/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── components/          # React components
│   │   │   ├── GameBoard.tsx    # Main board component
│   │   │   ├── GameControls.tsx # Game controls UI
│   │   │   └── RoyalGameOfUr.tsx# Main game component
│   │   └── lib/                 # Utilities and logic
│   │       ├── types.ts         # TypeScript types
│   │       ├── game-logic.ts    # Core game logic
│   │       ├── ai-service.ts    # AI API client
│   │       └── utils.ts         # Utility functions
│   └── worker/                  # Cloudflare Worker
│       ├── src/
│       │   ├── index.ts         # Worker HTTP handler
│       │   └── ai.zig          # Zig AI implementation
│       ├── package.json         # Worker dependencies
│       ├── wrangler.toml        # Worker configuration
│       └── tsconfig.json        # Worker TypeScript config
└── public/                  # Static assets
```

### Available Scripts

#### Main App

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:cf` - Build for Cloudflare Pages
- `npm run deploy:cf` - Deploy to Cloudflare Pages

#### AI Worker

- `npm run dev:worker` - Start worker development server
- `npm run build:worker` - Build worker
- `npm run deploy:worker` - Deploy worker to Cloudflare

## 🤖 AI Implementation

The AI is implemented in Zig for maximum performance and compiled to WebAssembly for Cloudflare Workers.

### AI Features:

- **Minimax Algorithm**: With alpha-beta pruning for optimal move selection
- **Position Evaluation**: Advanced scoring based on piece positions and game state
- **Difficulty Scaling**: Adjustable search depth for different skill levels
- **Fallback Logic**: TypeScript fallback when Zig AI is unavailable

### AI Evaluation Factors:

1. **Piece Advancement**: Reward pieces closer to finish
2. **Finished Pieces**: Heavily weight completed pieces
3. **Safety**: Consider rosette positions and opponent threats
4. **Tempo**: Balance aggressive and defensive play

## 🚀 Deployment

### Cloudflare Pages (Frontend)

1. **Build the app:**

   ```bash
   npm run build:cf
   ```

2. **Deploy to Cloudflare Pages:**
   ```bash
   npm run deploy:cf
   ```

### Cloudflare Workers (AI)

1. **Configure wrangler.toml:**

   ```toml
   name = "rgou-ai-worker"
   account_id = "your-account-id"
   ```

2. **Deploy the worker:**
   ```bash
   npm run deploy:worker
   ```

### Environment Variables

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_AI_WORKER_URL=http://localhost:8787
```

For production, set in Cloudflare Pages:

```bash
NEXT_PUBLIC_AI_WORKER_URL=https://your-worker.your-subdomain.workers.dev
```

## 🎮 API Endpoints

The AI Worker exposes these endpoints:

### POST /ai-move

Get the best move for the current game state.

```json
{
  "gameState": {
    /* GameState object */
  }
}
```

### POST /evaluate

Evaluate the current position.

```json
{
  "gameState": {
    /* GameState object */
  }
}
```

### GET /health

Health check endpoint.

## 🧪 Testing

Run the development servers and test:

1. Play a game in two-player mode
2. Switch to AI mode and test AI responses
3. Check AI worker endpoints directly
4. Verify fallback behavior when AI is unavailable

## 🔧 Configuration

### Next.js Configuration

- Configured for Cloudflare Pages deployment
- Static export enabled
- Edge runtime for optimal performance

### Worker Configuration

- TypeScript support
- CORS enabled for frontend requests
- Environment-based configuration

## 📈 Performance

- **Frontend**: Static site generation for fast loading
- **AI**: Zig compilation for maximum performance
- **Caching**: Cloudflare edge caching for global delivery
- **Optimization**: Tree-shaking and minification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Submit a pull request

## 📚 Historical Context

The Royal Game of Ur dates back to 2600-2400 BCE and was discovered in the Royal Cemetery at Ur by Sir Leonard Woolley. Game rules were deciphered from a cuneiform tablet by Irving Finkel at the British Museum.

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- British Museum for historical research
- Irving Finkel for rule interpretation
- Cloudflare for hosting platform
- Zig community for performance insights

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

The AI worker implementation is documented in detail in the [Cloudflare Worker Documentation](./docs/cloudflare-worker.md).

## Getting Started

First, run the development server:

```bash
npm run dev
```
