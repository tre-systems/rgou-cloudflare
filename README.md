# Royal Game of Ur

[![CI/CD](https://github.com/rgilks/rgou-cloudflare/actions/workflows/deploy.yml/badge.svg)](https://github.com/rgilks/rgou-cloudflare/actions/workflows/deploy.yml)

<div align="center">
 <img src="/docs/screenshot.png" alt="rgou Screenshot" width="408" />
  <br />
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

## 📚 Documentation

- **[docs/README.md](./docs/README.md)** – Documentation index and quick reference
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** – System design, components, deployment, and infrastructure
- **[AI-SYSTEM.md](./docs/AI-SYSTEM.md)** – Complete AI system guide (Classic AI, ML AI, testing, history)
- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** – Development workflow, testing, troubleshooting, best practices
- **[GAME-GUIDE.md](./docs/GAME-GUIDE.md)** – Game rules, strategy, historical context, and user info
- **[TODO.md](./docs/TODO.md)** – Project TODOs and improvements
- **[ml/README.md](./ml/README.md)** – Machine learning quick start, training, and troubleshooting
- **[worker/rust_ai_core/tests/README.md](./worker/rust_ai_core/tests/README.md)** – Rust AI core test suite and instructions

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
npm run db:setup

# Build WASM assets (required for AI to work)
npm run build:wasm-assets

# Start development server
npm run dev
```

The game will open at http://localhost:3000

### First Run Notes

- The first run may take longer as it builds WebAssembly assets
- If you encounter WASM build issues, run: `npm run build:wasm-assets`
- For ML training, you'll need Rust and Apple Silicon Mac (see [AI-SYSTEM.md](./docs/AI-SYSTEM.md))

### Common Setup Issues

- **WASM Build Failures**: Ensure wasm-pack version 0.12.1 is installed
- **Database Issues**: Run `npm run db:setup` to set up local SQLite
- **Dependency Issues**: Try `npm run nuke` to reset the environment

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed solutions.

## 🤖 AI System

The project features two distinct AI opponents:

- **Classic AI**: Expectiminimax algorithm with evolved genetic parameters
- **ML AI**: Neural network trained through self-play

Both AIs run entirely in the browser via WebAssembly. See [AI-SYSTEM.md](./docs/AI-SYSTEM.md) for details.

**📊 Performance Results**: For comprehensive AI comparison data, win rates, speed analysis, and recommendations, see [AI-MATRIX-RESULTS.md](./docs/AI-MATRIX-RESULTS.md).

## 🧠 Machine Learning

Train and improve the neural network AI with two training systems:

### 🚀 PyTorch Training (Recommended)

Fast GPU-accelerated training using PyTorch with Rust data generation:

```bash
# Install PyTorch dependencies
pip install -r requirements.txt

# Quick test (100 games, 10 epochs)
npm run train:pytorch:quick

# Standard training (1000 games, 50 epochs)
npm run train:pytorch

# Production training (2000 games, 100 epochs)
npm run train:pytorch:production
```

### 🦀 Rust Training (CPU Only)

Pure Rust training system with optimized CPU parallelization:

```bash
# Quick test (100 games, 10 epochs)
npm run train:rust:quick

# Standard training (1000 games, 50 epochs)
npm run train:rust

# Production training (2000 games, 100 epochs)
npm run train:rust:production
```

**Note**: PyTorch training requires GPU acceleration (CUDA or Apple Metal). Rust training works on any system but is slower.

## 🧬 Genetic Parameter Evolution

You can evolve and validate the genetic parameters for the classic AI:

```bash
# Evolve new genetic parameters (runs Rust evolution, saves to ml/data/genetic_params/evolved.json)
npm run evolve:genetic-params

# Validate evolved parameters against default (runs 100 games, prints win rates)
npm run validate:genetic-params
```

### Evolution Process

The evolution script uses a robust genetic algorithm with:

- **Population size:** 50 individuals
- **Generations:** 50 generations
- **Games per evaluation:** 100 games per individual
- **Post-evolution validation:** 1000 games to confirm improvement
- **Quality threshold:** Only saves parameters if they significantly outperform defaults

### Current Results (July 2025)

**Evolved Parameters Performance:**

- **Significant improvement** over default parameters
- **Evolution time:** ~42 minutes
- **Validation confirmed:** 1000-game test confirms significant improvement

**Key Parameter Changes:**

- `win_score`: 10000 → 8354 (-1646)
- `finished_piece_value`: 1000 → 638 (-362)
- `position_weight`: 15 → 30 (+15)
- `rosette_control_bonus`: 40 → 61 (+21)
- `capture_bonus`: 35 → 49 (+14)

The evolved parameters significantly outperform the defaults and are now used in production.

## 🧪 Testing

The project includes comprehensive testing:

```bash
# Run all tests (lint, type-check, unit tests, e2e tests)
npm run check

# Run unit tests only
npm run test

# Run end-to-end tests
npm run test:e2e

# Run AI comparison tests
npm run test:ai-comparison:fast
```

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed testing information.

## 📋 Available Scripts

The project includes a comprehensive set of npm scripts for development, testing, training, and deployment. For a complete reference with detailed explanations, see **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)**.

### 🚀 Quick Start Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run check        # Run all tests and checks
npm run nuke         # Reset environment (clean install)
```

### 🧠 AI Development Commands

```bash
npm run train:quick              # Quick ML training
npm run train:pytorch:production # Production PyTorch training
npm run evolve:genetic-params    # Evolve AI parameters
npm run test:ai-comparison:fast  # Test AI performance
```

### 🏗️ Build Commands

```bash
npm run build:wasm-assets        # Build WebAssembly modules
npm run build:cf                 # Build for Cloudflare deployment
npm run generate:sw              # Generate service worker
```

### 🗄️ Database Commands

```bash
npm run db:setup                 # Setup local database
npm run migrate:local            # Apply local migrations
npm run migrate:d1               # Apply production migrations
```

### 🧪 Testing Commands

```bash
npm run test                     # Run unit tests
npm run test:e2e                 # Run end-to-end tests
npm run test:coverage            # Run tests with coverage
npm run test:ai-comparison:fast  # Quick AI comparison
```

See **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** for the complete list with detailed explanations and usage examples.

## 🏗️ Architecture

The project evolved from hybrid client/server AI to pure client-side execution for optimal performance and offline capability. See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed system design.

### Key Components

- **Frontend**: Next.js with React, TypeScript, Tailwind CSS
- **AI Engine**: Rust compiled to WebAssembly
- **Database**: Cloudflare D1 (production), SQLite (development)
- **Deployment**: Cloudflare Pages with GitHub Actions

## 📚 Documentation

### Core Documentation

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System design, components, deployment, and infrastructure
- **[AI-SYSTEM.md](./docs/AI-SYSTEM.md)** - Complete AI system guide including Classic AI, ML AI, testing, and development history
- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Development workflow, testing strategies, troubleshooting, and best practices
- **[GAME-GUIDE.md](./docs/GAME-GUIDE.md)** - Game rules, strategy, historical context, and user information

### Additional Files

- **[TODO.md](./docs/TODO.md)** - Consolidated task list and improvements

## 🔧 Troubleshooting

### Common Issues

- **WASM Build Failures**: Run `npm run build:wasm-assets`
- **Database Issues**: Run `npm run db:setup`
- **Dependency Issues**: Try `npm run nuke`
- **Deployment**: Pin exact dependency versions for Cloudflare compatibility

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed solutions.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read the documentation and ensure all tests pass before submitting a pull request.

## 🙏 Acknowledgments

- **Irving Finkel** - British Museum curator who reconstructed the game rules
- **RoyalUr.net** - Comprehensive game analysis and strategy
- **Rust Community** - Excellent WebAssembly tooling and ecosystem
