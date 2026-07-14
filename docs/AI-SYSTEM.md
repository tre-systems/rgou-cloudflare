# AI System

The game has two AI opponents, both written in Rust and compiled to WebAssembly so they run locally in the browser with no network latency:

- **Classic AI** — expectiminimax search with alpha-beta pruning and tunable evaluation parameters
- **ML AI** — a value + policy neural network trained through self-play

For measured win rates and speed across every matchup, see [AI-MATRIX-RESULTS.md](./AI-MATRIX-RESULTS.md).

## Browser execution

The UI never sends a complete `GameState` to AI code. Both thin main-thread services share one lazily constructed `AIWorkerClient`, which sends a schema-validated `AIPosition`: seven squares per player, current player, and dice roll. The discriminated Worker protocol correlates each request by ID, times it out after 30 seconds, and restarts the Worker after timeout or failure.

The single Worker lazily loads one Rust/WASM module and dispatches Classic, heuristic, and ML requests. ML weights are fetched inside the Worker: it prefers the gzip asset, uses streaming `DecompressionStream`, parses and validates model metadata, network dimensions, and exact weight counts, then loads the arrays into WASM. The uncompressed JSON is a compatibility fallback. Search, inference, decompression, JSON parsing, and validation therefore stay off the UI thread.

The TypeScript and Rust rule implementations consume the same `test-fixtures/rules-conformance.json` cases. These fixtures cover entry, blocking, protected rosettes, captures, finishing, overshoot, and mirrored player tracks. Add a shared case whenever rule behavior changes.

## Classic AI

Expectiminimax extends minimax to games with chance. The search alternates:

- **Min/Max nodes** for the players' choices
- **Expectation nodes** for the dice roll, weighting child values by probability
- **Alpha-beta pruning** to skip branches that cannot affect the result

### Dice probabilities

Four binary dice give a roll of 0–4:

| Roll | Probability |
| ---- | ----------- |
| 0    | 1/16        |
| 1    | 4/16        |
| 2    | 6/16        |
| 3    | 4/16        |
| 4    | 1/16        |

### Search depth

The browser Classic AI searches to **depth 4** (`worker/rust_ai_core/src/wasm_api.rs`). The AI matrix benchmarks depths 1–3 by default and depth 4 under slow tests; depth 3 gives the best strength-for-speed in testing, while the browser uses depth 4 for maximum strength.

The optimized browser instance retains a transposition table across requests. A position hash includes all seven pieces for both players, current player, and genetic parameters. The table is bounded at 50,000 entries and clears before inserting beyond the ceiling, preventing an unbounded long-lived Worker cache.

### Evaluation parameters

The evaluation function is driven by a set of weights (`GeneticParams` in `worker/rust_ai_core/src/genetic_params.rs`): win score, finished-piece value, position weight, safety, rosette control, advancement, capture, and center-lane bonuses.

An evolutionary search (`cargo run --release --bin evolve_params`) tunes these against the defaults and writes an optimized set to `ml/data/genetic_params/evolved.json`. At runtime the AI loads that file and falls back to the built-in defaults if it is unavailable. The evolved set:

```json
{
  "win_score": 8354,
  "finished_piece_value": 638,
  "position_weight": 30,
  "safety_bonus": -13,
  "rosette_control_bonus": 61,
  "advancement_bonus": 11,
  "capture_bonus": 49,
  "center_lane_bonus": 4
}
```

Evolution and validation:

```bash
npm run evolve:genetic-params     # evolve, save to ml/data/genetic_params/evolved.json
npm run validate:genetic-params   # compare evolved vs default over many games
```

The search runs 50 generations of 50 individuals, 100 games per evaluation, and only keeps parameters that beat the defaults.

## ML AI

### Architecture

- **Input**: 150-feature vector describing the game state
- **Shared hidden layers**: 256 → 128 → 64 → 32 (ReLU)
- **Outputs**: a value head (1 unit, tanh) predicting the expected result, and a policy head (7 units, softmax) scoring moves
- The chosen move combines the value and policy outputs

The architecture is defined in `ml/config/training.json` and `worker/rust_ai_core/src/features.rs`.

### Training

Self-play generates games (value targets from outcomes, policy targets from move choices), which train the network. Two backends share the same presets:

| Backend | Hardware                      | Notes                           |
| ------- | ----------------------------- | ------------------------------- |
| PyTorch | GPU (CUDA or Apple Metal/MPS) | Faster; requires a GPU          |
| Rust    | CPU (parallel)                | Always available; no GPU needed |

Rust self-play derives an independent random stream for each game from the configured seed and game index. Indexed parallel collection keeps both game results and corpus ordering stable regardless of Rayon scheduling or core allocation.

| Preset     | Games | Epochs | Batch |
| ---------- | ----- | ------ | ----- |
| quick      | 100   | 10     | 32    |
| default    | 1000  | 50     | 32    |
| production | 2000  | 100    | 64    |

See [DEVELOPMENT.md](./DEVELOPMENT.md) and [ml/README.md](../ml/README.md) for training commands.

### Models

Trained weights live in `ml/data/weights/`:

| Model      | Games | Epochs |
| ---------- | ----- | ------ |
| PyTorch V5 | 2000  | 100    |
| ML-V2      | 1000  | 50     |
| ML-Fast    | 1000  | 50     |
| ML-V4      | 5000  | 100    |
| ML-Hybrid  | 1000  | 50     |

Convert and publish a model with `npm run load:ml-weights`.

Published weights carry training version, date, game/sample counts, seed, best validation loss, and an exact network shape. `ml/model-manifest.json` records the canonical source revision, training inputs, architecture, weight counts, and hashes for the source, JSON fallback, and deterministic gzip artifact. `npm run test:model-provenance` prevents these forms from drifting. `MLWeightsSchema` rejects incomplete metadata, the wrong architecture, non-finite values, and incorrect weight counts before data reaches Rust.

## Testing

The Rust test suite covers game logic, the full position hash, the bounded transposition table, every AI type, shared TypeScript/Rust conformance fixtures, and an AI-vs-AI matrix. See [worker/rust_ai_core/tests/README.md](../worker/rust_ai_core/tests/README.md) for how to run it, and [AI-MATRIX-RESULTS.md](./AI-MATRIX-RESULTS.md) for the generated results.

```bash
npm run test:ai-comparison:fast            # quick matrix (10 games per match)
npm run test:ai-comparison:comprehensive   # 100 games per match, plus slow tests
```

## Key files

- Classic AI core: `worker/rust_ai_core/src/lib.rs`
- Evaluation parameters: `worker/rust_ai_core/src/genetic_params.rs`
- Feature extraction: `worker/rust_ai_core/src/features.rs`
- WASM bindings: `worker/rust_ai_core/src/wasm_api.rs`
- Worker protocol and narrow position: `src/lib/ai-protocol.ts`
- Lazy typed Worker client: `src/lib/ai-worker-client.ts`
- Unified Worker: `src/lib/ai.worker.ts`
- Thin frontend adapters: `src/lib/wasm-ai-service.ts`, `src/lib/ml-ai-service.ts`
