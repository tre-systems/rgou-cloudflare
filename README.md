# Royal Game of Ur

[![CI/CD](https://github.com/rgilks/rgou-cloudflare/actions/workflows/deploy.yml/badge.svg)](https://github.com/rgilks/rgou-cloudflare/actions/workflows/deploy.yml)

<img src="/docs/screenshot.png" alt="rgou Screenshot" style="max-width:408px; max-height:712px; width:100%; height:auto;" />

<div align="center">
  <a href='https://ko-fi.com/N4N31DPNUS' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi2.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
  <hr />
</div>

A modern, web-based implementation of the ancient Royal Game of Ur, featuring a beautiful UI, offline support, and two powerful AI opponents (Classic and Machine Learning-based). Built with Next.js, TypeScript, Rust, and WebAssembly.

## What is the Royal Game of Ur?

The Royal Game of Ur is one of the oldest known board games, dating to around 2500 BCE in ancient Mesopotamia. It's a strategic race game where two players compete to move all seven pieces around a unique board and off the finish line first. The game combines luck (from dice rolls) with strategic decision-making, featuring special "rosette" squares that grant extra turns and safe havens.

This implementation brings this ancient game to life with modern technology, allowing you to play against sophisticated AI opponents that run entirely in your browser.

## Features

- **Faithful Recreation**: Complete implementation of the Royal Game of Ur
- **Dual AI System**:
  - **Classic AI**: Expectiminimax algorithm (53.6% win rate, instant speed)
  - **ML AI**: Neural network trained through self-play (50% win rate, <1ms/move)
- **AI vs. AI Mode**: Watch the two AIs compete
- **Browser-Native**: All AI runs locally via WebAssembly (no server calls)
- **PWA Support**: Works offline, installable on mobile devices
- **Game Statistics**: Track performance and save games to database
- **Modern UI**: Responsive design with animations and sound effects

## Quick Start

**Play Online**: https://rgou.tre.systems/

The game works in any modern browser and requires no installation.

## Development Setup

### Prerequisites

- [Git](https://git-scm.com/downloads)
- [Node.js (v20+)](https://nodejs.org/)
- [Rust & Cargo](https://www.rust-lang.org/tools/install)
- `cargo install wasm-pack`
- [Python 3.10+](https://www.python.org/downloads/) (for ML training, optional)

### Local Development

```bash
git clone <repository-url>
cd rgou-cloudflare
npm install
npm run migrate:local
npm run dev
```

Game opens at http://localhost:3000

## AI System

The project features two distinct AI opponents, each with unique characteristics:

### Classic AI (Expectiminimax)

- **Algorithm**: Expectiminimax with alpha-beta pruning
- **Performance**: 53.6% win rate, instant speed
- **Depth**: Optimized for depth 1 search
- **Use Case**: Production gameplay, competitive play

### ML AI (Neural Network)

- **Architecture**: Dual-head neural network (value + policy)
- **Training**: Self-play with imitation learning
- **Performance**: 50% win rate vs Classic AI, <1ms/move
- **Use Case**: Alternative playstyle, research platform

Both AIs run entirely in the browser via WebAssembly, providing desktop-level performance without server dependencies.

## Machine Learning Training

The project includes a comprehensive ML training system for developing and improving the neural network AI.

### Quick Training

```bash
# Train ML AI v2 (recommended)
npm run train:ml:version -- --version v2

# Train with custom parameters
python ml/scripts/train_ml_ai_version.py --version v3 --epochs 500

# Reuse existing games (faster)
python ml/scripts/train_ml_ai_version.py --version v2 --reuse-games
```

### Training Features

- **GPU Acceleration**: Automatic MPS (Apple Silicon) and CUDA support
- **Parallel Processing**: 3-8x faster data generation
- **Versioned Training**: Multiple model versions with scaled parameters
- **Progress Tracking**: Real-time training progress with detailed metrics
- **Weight Compression**: Automatic compression and optimization

### Available Versions

| Version | Games  | Epochs | Learning Rate | Purpose           |
| ------- | ------ | ------ | ------------- | ----------------- |
| v1      | 100    | 50     | 0.001         | Quick testing     |
| v2      | 1,000  | 100    | 0.001         | Standard training |
| v3      | 5,000  | 300    | 0.0005        | Extended training |
| v4      | 10,000 | 500    | 0.0003        | Advanced training |
| v5      | 20,000 | 1,000  | 0.0002        | Maximum training  |

## Testing

### Run All Tests

```bash
npm run check
```

### Test Configurations

```bash
# Quick tests (10 games each)
npm run test:rust:quick

# Comprehensive tests (100 games each)
npm run test:rust:slow

# End-to-end tests
npm run test:e2e
```

### Performance Testing

```bash
# Matrix comparison of all AI types
npm run test:rust:matrix

# ML AI evaluation
npm run evaluate:ml -- --model ml/data/weights/ml_ai_weights_v2.json
```

## Architecture

- **Frontend**: Next.js with React, TypeScript, Tailwind CSS
- **AI Engine**: Rust compiled to WebAssembly
- **Database**: Cloudflare D1 with Drizzle ORM
- **Deployment**: Cloudflare Pages with GitHub Actions

### Key Components

- `src/components/` - React UI components
- `src/lib/` - Game logic, AI services, state management
- `worker/rust_ai_core/` - Rust AI engine
- `ml/scripts/` - ML training system

## Documentation

### Current System

- **[AI System](./docs/ai-system.md)** - Classic expectiminimax AI implementation
- **[ML AI System](./docs/ml-ai-system.md)** - Machine learning AI implementation
- **[AI Performance](./docs/ai-performance.md)** - Current performance data and analysis
- **[Architecture Overview](./docs/architecture-overview.md)** - System design and components
- **[Game Rules and Strategy](./docs/game-rules-strategy.md)** - Game rules and strategic concepts

### Development & Testing

- **[Testing Strategy](./docs/testing-strategy.md)** - Testing approach and methodology
- **[Test Configuration Guide](./docs/test-configuration-guide.md)** - How to run different test configurations
- **[Troubleshooting Guide](./docs/troubleshooting.md)** - Common issues and solutions
- **[Current TODOs](./docs/current-todos.md)** - Active tasks and improvements

### Historical Research

- **[AI Development History](./docs/ai-development-history.md)** - **HISTORICAL** - All AI experiments, investigations, and lessons learned

## Performance

### Current AI Performance (July 2025)

| AI Type                | Win Rate  | Speed     | Use Case                |
| ---------------------- | --------- | --------- | ----------------------- |
| **Classic AI (EMM-1)** | **53.6%** | Instant   | **Production gameplay** |
| Classic AI (EMM-2)     | 53.2%     | Instant   | Alternative option      |
| Heuristic AI           | 50.8%     | Instant   | Educational baseline    |
| ML AI                  | 50.0%     | <1ms/move | Alternative playstyle   |
| Random AI              | 48.0%     | Instant   | Baseline testing        |

## Troubleshooting

### Common Issues

**Cloudflare Deployment Issues**

- Pin exact dependency versions: `npm install --save-exact next@15.3.4 @opennextjs/cloudflare@1.3.1 wrangler@4.22.0`
- Test both local and GitHub Actions deployments

**ML Training Issues**

- Ensure GPU is available for training (MPS for Apple Silicon, CUDA for NVIDIA)
- Use `--reuse-games` flag for faster iteration
- Check `ml/requirements.txt` for Python dependencies

**WASM Build Issues**

- Run `npm run build:wasm-assets` before `npm run check`
- Ensure `wasm-pack` is installed: `cargo install wasm-pack`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run check`
5. Submit a pull request

## License

Open source. See [LICENSE](LICENSE).
