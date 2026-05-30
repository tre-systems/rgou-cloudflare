# AI System

The game has two AI opponents, both written in Rust and compiled to WebAssembly so they run locally in the browser with no network latency:

- **Classic AI** — expectiminimax search with alpha-beta pruning and tunable evaluation parameters
- **ML AI** — a value + policy neural network trained through self-play

For measured win rates and speed across every matchup, see [AI-MATRIX-RESULTS.md](./AI-MATRIX-RESULTS.md).

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

## Testing

The Rust test suite covers game logic, every AI type, and an AI-vs-AI matrix. See [worker/rust_ai_core/tests/README.md](../worker/rust_ai_core/tests/README.md) for how to run it, and [AI-MATRIX-RESULTS.md](./AI-MATRIX-RESULTS.md) for the generated results.

```bash
npm run test:ai-comparison:fast            # quick matrix (10 games per match)
npm run test:ai-comparison:comprehensive   # 100 games per match, plus slow tests
```

## Key files

- Classic AI core: `worker/rust_ai_core/src/lib.rs`
- Evaluation parameters: `worker/rust_ai_core/src/genetic_params.rs`
- Feature extraction: `worker/rust_ai_core/src/features.rs`
- WASM bindings: `worker/rust_ai_core/src/wasm_api.rs`
- Frontend services: `src/lib/wasm-ai-service.ts`, `src/lib/ml-ai-service.ts`
