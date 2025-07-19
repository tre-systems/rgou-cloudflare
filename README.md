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

- Faithful recreation of the Royal Game of Ur
- Two AI opponents:
  - **Classic AI**: Uses expectiminimax algorithm for strategic depth (3-ply search, 81.2% win rate, 14.1ms/move)
- **ML AI**: Neural network trained through self-play for a different playstyle (61.2% win rate, 58.0ms/move)
- AI vs. AI mode to watch the two AIs compete
- All AI runs locally in your browser via WebAssembly (no server calls)
- PWA: works offline, installable
- Game statistics and database integration
- Modern, responsive UI

## Quick Start

Want to play right away? The game is available online and works in any modern browser. Just visit the deployed version to start playing against the AI.

https://rgou.tre.systems/

For developers who want to run locally or contribute:

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/downloads)
- [Node.js (v20+)](https://nodejs.org/)
- [Rust & Cargo](https://www.rust-lang.org/tools/install)
- `cargo install wasm-pack`
- [Python 3.10+](https://www.python.org/downloads/) (for ML training, optional)
- Install ML dependencies (for training, optional):
  - `pip install -r ml/requirements.txt`

### Local Development

```bash
git clone <repository-url>
cd rgou-cloudflare
npm install
npm run migrate:local
npm run dev
```

Game opens at http://localhost:3000

## Machine Learning (ML) Training System

The project uses a **parameterized training system** that supports multiple ML versions with scalable configurations. All training is now consolidated through a single, flexible system.

### Training System Overview

- **Main Script**: `ml/scripts/train_ml_ai_version.py` - Parameterized training for any ML version
- **Shell Wrapper**: `ml/scripts/train_ml_ai_version.sh` - Easy-to-use shell script with options
- **Base Training**: `ml/scripts/train_ml_ai.py` - Core training infrastructure (imported by versioned script)
- **Evaluation**: `ml/scripts/evaluate_ml_ai.py` - Model evaluation against Classic AI

### Available ML Versions

The system supports multiple ML versions with automatically scaled parameters:

| Version | Games  | Epochs | Learning Rate | Purpose           |
| ------- | ------ | ------ | ------------- | ----------------- |
| v1      | 100    | 50     | 0.001         | Quick testing     |
| v2      | 1,000  | 100    | 0.001         | Standard training |
| v3      | 5,000  | 300    | 0.0005        | Extended training |
| v4      | 10,000 | 500    | 0.0003        | Advanced training |
| v5      | 20,000 | 1,000  | 0.0002        | Maximum training  |

### Training Commands

```bash
# Train specific version (using parameterized command)
npm run train:ml:version -- --version v2
npm run train:ml:version -- --version v3
npm run train:ml:version -- --version v4

# Train with custom parameters
python ml/scripts/train_ml_ai_version.py --version v3 --epochs 500 --num-games 2000

# Reuse existing games (faster training)
python ml/scripts/train_ml_ai_version.py --version v3 --reuse-games

# List all version configurations
python ml/scripts/train_ml_ai_version.py --list-versions

# Shell script with options
bash ml/scripts/train_ml_ai_version.sh --version v3 --skip-test --reuse-games
```

### Training Features

- **Progress Bars**: Real-time epoch and batch progress bars with live loss updates
- **Game Reuse**: Option to reuse existing training games for faster iteration
- **Early Stopping**: Automatic early stopping when validation loss plateaus
- **Learning Rate Scheduling**: Adaptive learning rate based on validation performance
- **Weight Compression**: Automatic compression and quantization of trained weights
- **Metadata Tracking**: Comprehensive training metadata and version history
- **Parallel Processing**: Optimized parallel game processing for 3-8x faster data generation
- **GPU Acceleration**: Automatic MPS (Apple Silicon) and CUDA (NVIDIA) GPU detection and usage
- **Optimized Batch Sizes**: Larger batch sizes for GPU training (512 for MPS/CUDA)
- **Enhanced Logging**: Real-time epoch timing, batch progress, and detailed metrics

### Training Output

After training, you get:

- `ml/data/weights/ml_ai_weights_vX.json` - Main weights file
- `ml/data/weights/ml_ai_weights_vX.json.gz` - Compressed weights
- `training_data_cache.json` - Reusable training data (if generated)

### Loading and Testing

```bash
# Load weights into the app
npm run load:ml-weights ml/data/weights/ml_ai_weights_v3.json

# Test against Classic AI
cd worker/rust_ai_core && cargo test test_ml_v3_vs_expectiminimax_ai -- --nocapture

# Evaluate performance
npm run evaluate:ml -- --model ml/data/weights/ml_ai_weights_v3.json --num-games 100
```

## How to Use the ML AI (WASM)

The ML AI is a neural network-based opponent that runs efficiently in your browser via WebAssembly. You can play against it, or watch it compete against the Classic AI.

### ML AI WASM Interface

The ML AI is exposed to TypeScript via the following interface:

```ts
interface MLWasmModule {
  default: (input?: string | URL) => Promise<unknown>;
  init_ml_ai: () => void;
  load_ml_weights: (valueWeights: number[], policyWeights: number[]) => void;
  get_ml_ai_move: (gameState: unknown) => string;
  evaluate_ml_position: (gameState: unknown) => string;
  get_ml_ai_info: () => string;
  roll_dice_ml: () => number;
}
```

### WASM Asset Files

- `public/wasm/rgou_ai_core.js`
- `public/wasm/rgou_ai_core_bg.wasm`

### Loading Weights

To load weights into the ML AI:

```ts
mlWasmModule.load_ml_weights(valueWeights, policyWeights);
```

where `valueWeights` and `policyWeights` are arrays of numbers (float32) representing the neural network weights.

### Usage

- The ML AI worker loads the WASM module and initializes the ML AI with `init_ml_ai()`.
- Weights must be loaded before requesting moves or evaluations.
- Use `get_ml_ai_move(gameState)` to get the best move for a given game state.
- Use `evaluate_ml_position(gameState)` to get a value network evaluation for a game state.

For more details, see `docs/ml-ai-system.md` and `src/lib/ml-ai.worker.ts`.

## Documentation

### Current Implementation

- **[AI System](./docs/ai-system.md)** - Classic expectiminimax AI implementation
- **[ML AI System](./docs/ml-ai-system.md)** - Machine learning AI implementation
- **[Architecture Overview](./docs/architecture-overview.md)** - System design and components
- **[Game Rules and Strategy](./docs/game-rules-strategy.md)** - Game rules and strategic concepts
- **[Technical Implementation](./docs/technical-implementation.md)** - Implementation details

### Development & Testing

- **[Testing Strategy](./docs/testing-strategy.md)** - Testing approach and methodology
- **[Test Configuration Guide](./docs/test-configuration-guide.md)** - How to run different test configurations
- **[Troubleshooting Guide](./docs/troubleshooting.md)** - Common issues and solutions

### Historical Research & Future Development

- **[AI Development Experiments](./docs/ai-development-experiments.md)** - **HISTORICAL** - All AI experiments, investigations, and lessons learned
- **[Latest Matrix Comparison Results](./docs/latest-matrix-comparison-results.md)** - **CURRENT** - Latest performance data (July 2025)
- **[AI Performance Quick Reference](./docs/ai-performance-quick-reference.md)** - **CURRENT** - Quick reference for developers

## Troubleshooting

### Cloudflare Deployment Issues

#### "Failed to prepare server Error: An error occurred while loading the instrumentation hook"

This error occurs when there's a version mismatch between local and GitHub Actions environments, particularly with newer versions of Next.js (15.4.2+) that aren't compatible with Cloudflare Workers.

**Symptoms:**

- Application works locally but fails on Cloudflare with instrumentation hook errors
- GitHub Actions deployment works but local deployment fails
- Error message: "Failed to prepare server Error: An error occurred while loading the instrumentation hook"

**Solution:**
Pin the exact dependency versions that work with Cloudflare Workers:

```bash
npm install --save-exact next@15.3.4 @opennextjs/cloudflare@1.3.1 wrangler@4.22.0
```

**Why this happens:**

- Next.js 15.4.2+ introduced instrumentation hooks that aren't compatible with Cloudflare Workers
- The caret (`^`) in package.json allows compatible updates that break Cloudflare deployment
- GitHub Actions uses different versions than local environment

**Prevention:**

- Always use exact versions (without `^`) for critical dependencies
- Test both local and GitHub Actions deployments after dependency updates
- If you need to update dependencies, test thoroughly on Cloudflare first

## License

Open source. See [LICENSE](LICENSE).
