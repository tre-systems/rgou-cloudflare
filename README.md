# Royal Game of Ur - Cloudflare Edition

A modern, web-based implementation of the ancient Royal Game of Ur, featuring a beautiful UI, offline support, and two powerful AI opponents (Classic and Machine Learning-based). Built with Next.js, TypeScript, Rust, and WebAssembly.

## Features

- Faithful recreation of the Royal Game of Ur
- Play against Classic (Expectiminimax) or ML (Neural Network) AI
- AI vs. AI mode
- PWA: works offline, installable
- Game statistics and database integration
- Modern, responsive UI

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/downloads)
- [Node.js (v18+)](https://nodejs.org/)
- [Rust & Cargo](https://www.rust-lang.org/tools/install)
- `cargo install wasm-pack`
- [Python 3.8+](https://www.python.org/downloads/) (for ML training, optional)
- `pip install torch torchvision` (for ML training, optional)

### Local Development

```bash
git clone <repository-url>
cd rgou-cloudflare
npm install
npm run migrate:local
npm run dev
```

Game opens at http://localhost:3000.

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

- [ML AI System](./docs/ml-ai-system.md)
- [AI System (Classic)](./docs/ai-system.md)
- [Architecture Overview](./docs/architecture-overview.md)
- [Game Rules and Strategy](./docs/game-rules-strategy.md)
- [Technical Implementation](./docs/technical-implementation.md)
- [Testing Strategy](./docs/testing-strategy.md)

## License

Open source. See [LICENSE](LICENSE).
