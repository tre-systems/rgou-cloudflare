# 🏺 Royal Game of Ur - Cloudflare Edition

A modern implementation of the ancient Mesopotamian board game "Royal Game of Ur" built with Next.js, TypeScript, and powered by a unique dual AI engine written in Rust.

## 🌟 Features

- **Authentic Gameplay**: Faithful recreation of the 4,500-year-old Royal Game of Ur.
- **Dual AI Engine**:
  - **Cloud AI**: High-performance Rust AI on Cloudflare Workers for deep strategic analysis.
  - **Client AI**: In-browser Rust/Wasm AI for offline play and instant responses.
- **Modern UI**: Beautiful, responsive interface built with React, Tailwind CSS, and Framer Motion animations.
- **Cloud-Native**: Deployed on Cloudflare for global low-latency access.
- **PWA & Offline Ready**: Installable Progressive Web App with client-side AI for offline gameplay.
- **Real-time**: Smooth animations and real-time game state updates with sound effects.
- **Single Player Mode**: Challenge the sophisticated AI opponent.

## 🎯 Game Rules

The Royal Game of Ur is a race game where each player tries to move all 7 pieces around the board and off the finish before their opponent.

### Key Rules:

- **Dice**: Roll 4 binary dice (tetrahedra). Count the marked corners (0-4 moves).
- **Movement**: Move pieces along your track from start to finish.
- **Combat**: Land on opponent pieces to send them back to start (except on rosettes).
- **Rosettes**: Special starred squares are safe zones and grant extra turns.
- **Winning**: First player to move all 7 pieces off the board wins.

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

This project uses a unique dual-AI architecture, allowing the user to switch seamlessly between a powerful server-side AI and an instant client-side AI.

## 🛠️ Development

### Project Structure

```
rgou-cloudflare/
├── src/
│   ├── app/                    # Next.js app router pages
│   ├── components/             # React components (GameBoard, etc.)
│   └── lib/                    # Core application logic
│       ├── wasm/               # Client-side Wasm AI (built from rust_ai_core)
│       ├── ai-service.ts       # Server-side AI API client
│       ├── wasm-ai-service.ts  # Client-side Wasm AI service
│       └── game-logic.ts       # Core game rules
├── public/
│   └── wasm/                   # Wasm assets served to the browser
├── worker/                     # Server-side AI worker
│   ├── rust_ai_core/           # Core Rust AI logic (shared with client)
│   │   └── src/lib.rs
│   ├── src/                    # Worker-specific Rust code
│   │   └── lib.rs
│   └── wrangler.toml           # Worker configuration
└── docs/                       # Project documentation
    ├── deployment.md           # Step-by-step deployment guide
    ├── cloudflare-worker.md    # Server-side AI documentation
    └── minimax-ai-specification.md # AI algorithm specification
```

### Available Scripts

#### Main App

- `npm run dev` - Start development server.
- `npm run build` - Build for production.
- `npm run postbuild` - Build client-side Wasm and place it in `src/lib` and `public`.
- `npm run deploy:cf` - Deploy to Cloudflare Workers.
- `npm run lint` - Run ESLint.
- `npm run lint:fix` - Fix ESLint errors.

#### AI Worker

- `npm run dev:worker` - Start worker development server.
- `npm run build:worker` - Build Rust worker.
- `npm run deploy:worker` - Deploy worker to Cloudflare.
- `npm run setup:worker` - Install worker dependencies.

## 🤖 Dual AI Engine

The game features a unique dual AI system, allowing the user to switch between a server-powered AI and a client-side Wasm AI.

- **Server AI**: A high-performance Rust AI deployed on **Cloudflare Workers**. It uses a deep minimax search with aggressive optimizations for the strongest level of play. This is the "heavy-lifting" AI.
- **Client AI**: The same core Rust AI logic is compiled to **WebAssembly (Wasm)** and runs directly in the browser. This enables **offline play** and provides a faster, more responsive opponent for casual games, while still being very challenging.

The core logic is shared in the `worker/rust_ai_core` crate, ensuring consistent AI behavior across both platforms.

### AI Features:

- **Advanced Minimax Algorithm**: With alpha-beta pruning and transposition tables.
- **Strategic Position Evaluation**: Multi-factor scoring based on piece positions, safety, and tactics.
- **Mathematically Correct Dice Probabilities**: Proper Royal Game of Ur dice distribution.
- **Adaptive Difficulty**: Sophisticated evaluation with depth-8 search on the server AI.
- **Performance Optimized**: 50-70% performance improvement with transposition tables.
- **Fallback Logic**: TypeScript fallback when Rust AI is unavailable.

### AI Evaluation Factors:

1. **Piece Advancement**: Reward pieces closer to finish
2. **Finished Pieces**: Heavily weight completed pieces
3. **Safety Considerations**: Value rosette positions and threat assessment
4. **Tactical Awareness**: Blocking, capturing, and tempo control
5. **Board Control**: Strategic positioning in shared sections
6. **Game Phase Recognition**: Adaptive strategy for opening/middle/endgame

## 🚀 Deployment

The application is deployed entirely on the Cloudflare ecosystem. For detailed, step-by-step instructions, see the **[Deployment Guide](./docs/deployment.md)**.

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

## 📚 Documentation

This project is documented to provide a clear overview of its architecture, AI, and deployment process.

- **[Deployment Guide](./docs/deployment.md)**: Step-by-step instructions for deploying the application to Cloudflare.
- **[Cloudflare Worker AI Documentation](./docs/cloudflare-worker.md)**: A detailed look at the server-side Rust AI implementation.
- **[Minimax AI Specification](./docs/minimax-ai-specification.md)**: A deep dive into the AI's algorithm, evaluation function, and strategic design.

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

# Royal Game of Ur - PWA Edition

> An ancient Mesopotamian board game dating back 4,500 years, now available as a Progressive Web App!

## Features

- **Progressive Web App (PWA)**: Install on your device for native-like experience
- **Offline Play**: Play against AI even without internet connection
- **Ancient Strategy**: Experience the world's oldest known board game
- **AI Opponent**: Challenge yourself against a Rust-powered AI
- **Modern UI**: Beautiful, responsive design with animations
- **Cross-Platform**: Works on desktop, mobile, and tablet

## PWA Features

### Installation

- **Install Prompt**: Automatic installation prompt after a few seconds
- **Home Screen**: Add to home screen on mobile devices
- **Standalone Mode**: Runs like a native app when installed
- **App Icons**: Custom icons for all device sizes

### Offline Capabilities

- **Service Worker**: Caches game assets for offline play
- **Network Detection**: Shows online/offline status
- **Offline Fallback**: Dedicated offline page when no connection
- **Background Sync**: Syncs data when connection is restored

### Performance

- **Caching Strategy**: Smart caching for optimal performance
- **Fast Loading**: Pre-cached critical resources
- **Progressive Enhancement**: Works without JavaScript enabled

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Generate PWA icons
npm run generate:icons

# Start development server
npm run dev

# Build for production (includes PWA assets)
npm run pwa:build
```

### Building for Production

The app includes several build targets:

- `npm run build` - Standard Next.js build
- `npm run pwa:build` - Build with PWA icons generated
- `npm run build:cf` - Build for Cloudflare deployment

## PWA Installation

### Desktop (Chrome/Edge)

1. Visit the app in your browser
2. Look for the install icon in the address bar
3. Click "Install" when prompted
4. The app will open in its own window

### Mobile (iOS/Android)

1. Open the app in Safari (iOS) or Chrome (Android)
2. Tap the install prompt that appears
3. Or use "Add to Home Screen" from the browser menu
4. The app icon will appear on your home screen

## Offline Play

The Royal Game of Ur works fully offline! The AI opponent runs entirely in your browser using WebAssembly, so you can play even without an internet connection.

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **PWA**: Service Worker, Web App Manifest, Workbox
- **AI Engine**: Rust compiled to WebAssembly
- **Backend**: Cloudflare Workers (Rust)
- **Deployment**: Cloudflare Pages + Workers

## PWA Checklist

- ✅ Web App Manifest
- ✅ Service Worker
- ✅ HTTPS (required for PWA)
- ✅ Responsive Design
- ✅ App Icons (all sizes)
- ✅ Offline Functionality
- ✅ Install Prompts
- ✅ Fast Loading
- ✅ Network Status Detection

## Browser Support

The PWA features work in all modern browsers:

- Chrome/Chromium (full PWA support)
- Firefox (basic PWA support)
- Safari (iOS Web App support)
- Edge (full PWA support)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add PWA icons with `npm run generate:icons`
4. Test PWA features in multiple browsers
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

Experience the ancient game of Ur like never before - install it as a PWA and play anywhere, anytime! 🏺✨
