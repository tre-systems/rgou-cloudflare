# Royal Game of Ur

[![CI/CD](https://github.com/rgilks/rgou-cloudflare/actions/workflows/deploy.yml/badge.svg)](https://github.com/rgilks/rgou-cloudflare/actions/workflows/deploy.yml)

<img src="/docs/screenshot.png" alt="rgou Screenshot" style="max-width:408px; max-height:712px; width:100%; height:auto;" />

<div align="center">
  <a href='https://ko-fi.com/N4N31DPNUS' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi2.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
  <hr />
</div>

A modern web implementation of the ancient Royal Game of Ur (2500 BCE) with dual AI opponents, offline support, and beautiful animations. Built with Next.js, TypeScript, Rust, and WebAssembly.

## 🎮 Play Now

**[Play Online](https://rgou.tre.systems/)** - Works in any modern browser, no installation required.

## ✨ Features

- **Dual AI System**: Classic expectiminimax (53.6% win rate) + Neural network (50% win rate)
- **Browser-Native**: All AI runs locally via WebAssembly - no server calls
- **Offline Support**: PWA with full offline gameplay
- **Modern UI**: Responsive design with animations and sound effects
- **Game Statistics**: Track performance and save games to database

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** ([Download](https://nodejs.org/)) - Required for Next.js 15
- **Rust & Cargo** ([Install](https://www.rust-lang.org/tools/install)) - For WebAssembly compilation
- **wasm-pack**: `cargo install wasm-pack --version 0.12.1 --locked` - For WASM builds

### Development Setup

```bash
# Clone the repository
git clone https://github.com/rgilks/rgou-cloudflare.git
cd rgou-cloudflare

# Install dependencies
npm install

# Set up local database
npm run migrate:local

# Start development server
npm run dev
```

The game will open at http://localhost:3000

### First Run Notes

- The first run may take longer as it builds WebAssembly assets
- If you encounter WASM build issues, run: `npm run build:wasm-assets`
- For ML training, you'll also need Python 3.10+ (see [ML AI System](./docs/ml-ai-system.md))

### Common Setup Issues

- **WASM Build Failures**: Ensure wasm-pack version 0.12.1 is installed
- **Database Issues**: Run `npm run migrate:local` to set up local SQLite
- **Dependency Issues**: Try `npm run nuke` to reset the environment

See [Troubleshooting Guide](./docs/troubleshooting.md) for detailed solutions.

## 🤖 AI System

The project features two distinct AI opponents:

- **Classic AI**: Expectiminimax algorithm with alpha-beta pruning (instant speed)
- **ML AI**: Neural network trained through self-play (<1ms/move)

Both AIs run entirely in the browser via WebAssembly. See [AI System](./docs/ai-system.md) and [ML AI System](./docs/ml-ai-system.md) for details.

## 🧠 Machine Learning

Train and improve the neural network AI:

```bash
# Quick training
npm run train:ml:version -- --version v2

# Custom training
python ml/scripts/train_ml_ai_version.py --version v3 --epochs 500
```

Features GPU acceleration, parallel processing, and versioned training. See [ML AI System](./docs/ml-ai-system.md) for complete training guide.

## 🧪 Testing

```bash
# Run all tests
npm run check

# Quick tests (10 games)
npm run test:rust:quick

# Comprehensive tests (100 games)
npm run test:rust:slow

# End-to-end tests
npm run test:e2e
```

See [Testing Strategy](./docs/testing-strategy.md) for detailed testing information.

## 🏗️ Architecture

- **Frontend**: Next.js with React, TypeScript, Tailwind CSS
- **AI Engine**: Rust compiled to WebAssembly (client-side only)
- **Database**: Cloudflare D1 with Drizzle ORM
- **Deployment**: Cloudflare Pages with GitHub Actions

The project evolved from hybrid client/server AI to pure client-side execution for optimal performance and offline capability. See [Architecture Overview](./docs/architecture-overview.md) for detailed system design.

## 📊 Performance

| AI Type                | Win Rate  | Speed     | Use Case                |
| ---------------------- | --------- | --------- | ----------------------- |
| **Classic AI (EMM-1)** | **53.6%** | Instant   | **Production gameplay** |
| ML AI                  | 50.0%     | <1ms/move | Alternative playstyle   |
| Heuristic AI           | 50.8%     | Instant   | Educational baseline    |

See [AI Performance](./docs/ai-performance.md) for detailed analysis.

## 📚 Documentation

### Core System

- **[Architecture Overview](./docs/architecture-overview.md)** - System design and components
- **[AI System](./docs/ai-system.md)** - Classic expectiminimax AI implementation
- **[ML AI System](./docs/ml-ai-system.md)** - Machine learning AI implementation
- **[AI Performance](./docs/ai-performance.md)** - Performance data and analysis
- **[Game Rules and Strategy](./docs/game-rules-strategy.md)** - Game rules and strategic concepts

### Development

- **[Testing Strategy](./docs/testing-strategy.md)** - Testing approach and methodology
- **[Troubleshooting Guide](./docs/troubleshooting.md)** - Common issues and solutions
- **[TODO](./docs/TODO.md)** - Consolidated task list and improvements

### Infrastructure

- **[Cloudflare Worker Infrastructure](./docs/cloudflare-worker-infrastructure.md)** - Preserved server-side infrastructure

## 🔧 Troubleshooting

**Common Issues:**

- **WASM Build**: Run `npm run build:wasm-assets` before `npm run check`
- **ML Training**: Ensure GPU available, use `--reuse-games` for faster iteration
- **Deployment**: Pin exact dependency versions for Cloudflare compatibility

See [Troubleshooting Guide](./docs/troubleshooting.md) for detailed solutions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run check`
5. Submit a pull request

## 📄 License

Open source. See [LICENSE](LICENSE).
