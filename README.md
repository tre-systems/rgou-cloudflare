# Royal Game of Ur - Cloudflare

## ML AI WASM Integration

The ML AI is now fully integrated into the unified Rust AI core. The WASM build exposes the following interface for use in TypeScript:

```
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

To load weights into the ML AI, call:

```
mlWasmModule.load_ml_weights(valueWeights, policyWeights);
```

where `valueWeights` and `policyWeights` are arrays of numbers (float32) representing the neural network weights.

### Usage

- The ML AI worker loads the WASM module and initializes the ML AI with `init_ml_ai()`.
- Weights must be loaded before requesting moves or evaluations.
- Use `get_ml_ai_move(gameState)` to get the best move for a given game state.
- Use `evaluate_ml_position(gameState)` to get a value network evaluation for a game state.

### Migration Notes

- The ML AI Rust code is now merged into the main Rust AI core crate.
- All WASM assets are unified under `public/wasm/rgou_ai_core.*`.
- Old references to `ml_ai_core` or Python-only training are obsolete.

For more details, see `docs/ml-ai-system.md` and `src/lib/ml-ai.worker.ts`.
