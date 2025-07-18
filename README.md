# Royal Game of Ur

[![CI/CD](https://github.com/rgilks/rgou-cloudflare/actions/workflows/deploy.yml/badge.svg)](https://github.com/rgilks/rgou-cloudflare/actions/workflows/deploy.yml)

<img src="/docs/screenshot.png" alt="rgou Screenshot" style="max-width:408px; max-height:712px; width:100%; height:auto;" />

<div align="center">
  <a href='https://ko-fi.com/N4N31DPNUS' target='_blank'><img height='36' style='border:0px;height:36px;margin-bottom: 20px;' src='https://storage.ko-fi.com/cdn/kofi2.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
</div>

A modern, web-based implementation of the ancient Royal Game of Ur, featuring a beautiful UI, offline support, and two powerful AI opponents (Classic and Machine Learning-based). Built with Next.js, TypeScript, Rust, and WebAssembly.

## What is the Royal Game of Ur?

The Royal Game of Ur is one of the oldest known board games, dating to around 2500 BCE in ancient Mesopotamia. It's a strategic race game where two players compete to move all seven pieces around a unique board and off the finish line first. The game combines luck (from dice rolls) with strategic decision-making, featuring special "rosette" squares that grant extra turns and safe havens.

This implementation brings this ancient game to life with modern technology, allowing you to play against sophisticated AI opponents that run entirely in your browser.

## Features

- Faithful recreation of the Royal Game of Ur
- Two AI opponents:
  - **Classic AI**: Uses expectiminimax algorithm for strategic depth (6-ply search)
  - **ML AI**: Neural network trained through self-play for a different playstyle
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

## Machine Learning (ML) Folder Structure

All files and scripts related to ML model training, weights, and utilities are now organized under the `ml/` directory:

- `ml/data/weights/` — Trained neural network weights (value and policy networks)
- `ml/data/cache/` — Training cache and intermediate data
- `ml/data/training/` — Training datasets and logs
- `ml/scripts/` — All scripts for training, testing, and managing ML models:
  - `train_ml_ai.py` — Main training script (Python)
  - `train_ml_ai.sh` — Shell wrapper for training
  - `test_ml_vs_expectiminimax.sh` — Test ML AI vs. classic AI
  - `check_training_status.sh` — Check training progress
  - `load-ml-weights.ts` — Load weights into the app (TypeScript)
  - `build_rust_ai.sh` — Build Rust AI core

## How to Train and Use the ML AI

### Prerequisites

- [Python 3.10+](https://www.python.org/downloads/)
- Install ML dependencies:
  - `pip install -r ml/requirements.txt`
- [Rust & Cargo](https://www.rust-lang.org/tools/install)
- `cargo install wasm-pack`

### Training

To train the ML AI from scratch or with synthetic data:

```bash
npm run train:ml           # Standard training
npm run train:ml:synthetic # Training with synthetic data
```

These scripts now use the new path: `ml/scripts/train_ml_ai.py`.

### Loading Weights

After training, load the weights into the app:

```bash
npm run load:ml-weights
```

This uses `ml/scripts/load-ml-weights.ts`.

### Testing and Utilities

- Run ML vs. Classic AI: `ml/scripts/test_ml_vs_expectiminimax.sh`
- Check training status: `ml/scripts/check_training_status.sh`
- Build Rust AI core: `ml/scripts/build_rust_ai.sh`
- **Run E2E tests (headless):** `npm run test:e2e`
- **Run E2E tests (UI):** `npm run test:e2e:ui`

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

## Version Management

This project uses a simplified semantic versioning system. All version information is centralized in `src/lib/versions.ts`.

### Updating Versions

To update all version numbers across the project:

```bash
npm run version:update <new-version>
```

Example:

```bash
npm run version:update 1.1.0
```

This will update:

- `src/lib/versions.ts` - All version constants
- `package.json` - Node.js package version
- `worker/rust_ai_core/Cargo.toml` - Rust crate version

### Version Components

- **app**: Main application version (increment for any significant changes)
- **classicAI**: Classic AI version (increment when expectiminimax logic changes)
- **mlAI**: ML AI version (increment when neural network changes)
- **game**: Game version (increment when game rules change)

## Documentation

- [ML AI System](./docs/ml-ai-system.md)
- [AI System (Classic)](./docs/ai-system.md)
- [Architecture Overview](./docs/architecture-overview.md)
- [Game Rules and Strategy](./docs/game-rules-strategy.md)
- [Technical Implementation](./docs/technical-implementation.md)
- [Testing Strategy](./docs/testing-strategy.md)

## License

Open source. See [LICENSE](LICENSE).
