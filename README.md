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

- **Dual AI System**: Classic expectiminimax + Neural network
- **Browser-Native**: All AI runs locally via WebAssembly
- **Offline Support**: PWA with full offline gameplay
- **Modern UI**: Responsive design with animations and sound effects

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** ([Download](https://nodejs.org/)) - Required for Next.js 15
- **Rust & Cargo** ([Install](https://www.rust-lang.org/tools/install)) - For WebAssembly compilation
- **wasm-pack**: `cargo install wasm-pack --version 0.12.1 --locked` - For WASM builds

**Note**: This project was developed on an M1 Mac. While it should work on other platforms, some optimizations (especially for ML training) are specifically tuned for Apple Silicon.

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
- For ML training, you'll need Rust and Apple Silicon Mac (see [Training System](./docs/training-system.md))

### Common Setup Issues

- **WASM Build Failures**: Ensure wasm-pack version 0.12.1 is installed
- **Database Issues**: Run `npm run migrate:local` to set up local SQLite
- **Dependency Issues**: Try `npm run nuke` to reset the environment

See [Troubleshooting Guide](./docs/troubleshooting.md) for detailed solutions.

## 🤖 AI System

The project features two distinct AI opponents:

- **Classic AI**: Expectiminimax algorithm with alpha-beta pruning
- **ML AI**: Neural network trained through self-play
  - **v2 Model**: **44% win rate vs Classic AI** - **Best Performance** ✅
  - **Fast Model**: 36% win rate vs Classic AI - **Competitive**
  - **v4 Model**: 32% win rate vs Classic AI - **Needs Improvement** ⚠️
  - **Hybrid Model**: 30% win rate vs Classic AI - **Needs Improvement** ⚠️

Both AIs run entirely in the browser via WebAssembly. See [AI System](./docs/ai-system.md) and [ML AI System](./docs/ml-ai-system.md) for details.

## 🧠 Machine Learning

Train and improve the neural network AI with the pure Rust system:

```bash
# Quick test
npm run train:ml:test

# Standard training
npm run train:ml

# Production training
npm run train:ml:v5

# Custom training
cd worker/rust_ai_core && cargo run --bin train --release --features training -- train 2000 75 0.001 32 4 custom_weights.json
```

**Optimized Features:**

- **🦀 Rust Data Generation**: Fast parallel game simulation using all CPU cores
- **🔥 Rust GPU Training**: Efficient neural network training with Burn framework
- **⚡ Apple Silicon GPU**: Native Metal backend acceleration
- **📊 Comprehensive Logging**: Detailed progress tracking and performance metrics
- **📁 Organized Storage**: Training data and weights stored in `ml/data/`
- **🔄 Real-time Progress Updates**: Frequent progress updates during training
- **📈 Performance Metrics**: Games per second, ETA, and detailed timing information

See [Training System](./docs/training-system.md) for complete training guide.

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

## 📚 Documentation

### Core System

- **[Architecture Overview](./docs/architecture-overview.md)** - System design and components
- **[AI System](./docs/ai-system.md)** - Classic expectiminimax AI implementation
- **[Training System](./docs/training-system.md)** - Machine learning training system
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

## 📄 License

Open source. See [LICENSE](LICENSE).
