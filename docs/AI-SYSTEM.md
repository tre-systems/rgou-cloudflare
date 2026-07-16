# AI System

The game has three AI opponents, all written in Rust and compiled to WebAssembly. Search and inference run locally; there is no server-side AI service:

- **Classic AI** — expectiminimax search with alpha-beta pruning and tunable evaluation parameters
- **ML AI** — a value + policy neural network trained from expectiminimax-labelled simulated games
- **Oracle AI** — a compact value network distilled from the published strong solution of the game

These are preserved as separate strategies: Classic searches at runtime, ML captures the earlier self-play experiment, and Oracle approximates exact tablebase values. The broad [AI matrix](./AI-MATRIX-RESULTS.md) compares research fixtures; [deployed matchup results](./AI-DEPLOYED-RESULTS.md) compare the three opponents available in the browser. For Oracle's research, design, and evidence, see [ORACLE-AI.md](./ORACLE-AI.md).

Watch mode accepts an independent choice for each side from Classic, ML, and Oracle. The selected pairing uses the same typed mode policy as normal games and is retained across a page reload.

## Browser execution

The UI never sends a complete `GameState` to AI code. The thin main-thread services share one lazily constructed `AIWorkerClient`, which sends a schema-validated `AIPosition`: seven squares per player, current player, and dice roll. The discriminated Worker protocol correlates each request by ID and times it out after 30 seconds. A timeout, transport failure, or invalid response restarts the Worker and rejects every pending request.

The single Worker lazily loads one Rust/WASM module and dispatches Classic, heuristic, ML, and Oracle requests. Learned weights are fetched inside the Worker: it prefers each gzip asset, uses streaming `DecompressionStream`, parses and validates model metadata, network dimensions, and exact weight counts, then loads the arrays into WASM. A failed, stale, or incompatible compressed artifact falls back to a freshly fetched uncompressed JSON compatibility asset. Search, inference, decompression, JSON parsing, and validation therefore stay off the UI thread.

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

The browser Classic AI searches to **depth 3** (`BROWSER_CLASSIC_AI_DEPTH`). This keeps the deliberate search opponent responsive in the Worker. The normal AI matrix benchmarks depths 1–3; slow tests add depth 4 for research only.

The optimized browser instance retains a transposition table across requests. A position hash includes all seven pieces for both players, current player, and genetic parameters. The table is bounded at 50,000 entries and clears before inserting beyond the ceiling, preventing an unbounded long-lived Worker cache.

### Evaluation parameters

The evaluation function is driven by a set of weights (`GeneticParams` in `worker/rust_ai_core/src/genetic_params.rs`): win score, finished-piece value, position weight, safety, rosette control, advancement, capture, and center-lane bonuses.

An evolutionary search (`cargo run --release --bin evolve_params`) tunes these against the defaults and writes an optimized set to `ml/data/genetic_params/evolved.json`. The Rust build embeds that JSON for native and WASM use; malformed embedded data falls back to the built-in defaults. The evolved set is:

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

The search runs 50 generations of 50 individuals with 100 games per evaluation. It writes a candidate only when a final 1,000-game validation exceeds a 55% win rate against the defaults.

## ML AI

### Architecture

- **Input**: the same 150-feature game-state vector is supplied to both networks
- **Networks**: independent value and policy MLPs, each with 256 → 128 → 64 → 32 hidden units (ReLU)
- **Outputs**: the value network emits 1 tanh unit estimating normalized expectiminimax evaluation; the policy network emits a 7-way softmax over piece choices
- Move scoring combines the successor value from the mover's perspective, current policy probability, and fixed finish/capture/rosette bonuses

The architecture is defined in `ml/config/training.json` and `worker/rust_ai_core/src/features.rs`.

### Training

The data generator plays expectiminimax against itself using the embedded evolved evaluation parameters. A zero roll or position with no legal move passes the turn exactly as it does in the game. At each playable position, expectiminimax supplies a normalized Player 2 evaluation target and a one-hot best-move target for the value and policy networks. Runtime move selection converts successor values back to the mover's perspective before ranking legal moves. Two training backends share the same presets:

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

### Model contract

`ml/data/weights/ml_ai_weights_pytorch_v5.json` is the production source model. Its verified metadata records 2,000 simulated games, 100 epochs, seed 42, 303,228 training samples, and the best validation loss. The Fast, V4, and Hybrid files in the same directory are comparison fixtures for the AI matrix, not deployment sources; their legacy metadata is not treated as authoritative provenance.

`npm run load:ml-weights` validates and publishes the selected production source. `ml/model-manifest.json` records its source revision, training-input hashes, architecture, exact weight counts, and hashes for the source, JSON fallback, and deterministic gzip artifact. `npm run test:model-provenance` prevents those forms from drifting. TypeScript and Rust reject incomplete metadata, the wrong architecture, non-finite values, and short or oversized weight arrays.

## Oracle AI

Oracle is a `32 → 128 → 128 → 64 → 1` ReLU value network with a tanh output. Its 32-value canonical input describes current-player and opponent occupancy, reserve counts, and finished counts. It deliberately omits colour identity, dice, piece indices, handcrafted scores, duplicates, and padding.

The teacher is the 16-bit tablebase published with the 2025 strong solution of the Finkel ruleset. Training samples exact pre-roll win probabilities from that external 827 MB artifact; the tablebase never ships to browsers. The production run uses two million training positions, 100,000 validation positions, and 100,000 disjoint test positions. The pinned configuration, source and tablebase hashes, sample identity, candidate results, and held-out metrics are stored with the model.

At runtime Rust enumerates legal moves with the rules engine, evaluates each successor, and converts the successor's current-player probability back to the mover's perspective. A rosette retains the same perspective; a normal turn change uses `1 - V`; an immediate win is `1`. This keeps move legality and turn semantics in the rules engine and avoids a policy head or post-training move bonuses.

The model is an approximation of an exact teacher, not a perfect-play claim. The independent Classic and ML opponents remain available, and the generated matrix reports all three. [ORACLE-AI.md](./ORACLE-AI.md) is the authority for feature semantics, experiment results, promotion gates, reproducibility, and limitations.

## Testing

The Rust test suite covers game logic, the full position hash, the bounded transposition table, every AI type, Oracle symmetry and shared Python/Rust feature fixtures, TypeScript/Rust rule-conformance fixtures, and AI matchups. The deployed benchmark uses deterministic dice, an even number of games, and alternating seats. See [worker/rust_ai_core/tests/README.md](../worker/rust_ai_core/tests/README.md) for commands, [AI-DEPLOYED-RESULTS.md](./AI-DEPLOYED-RESULTS.md) for browser-opponent results, and [AI-MATRIX-RESULTS.md](./AI-MATRIX-RESULTS.md) for the broader matrix.

```bash
npm run test:ai-comparison:fast            # quick matrix (10 games per match)
npm run test:ai-comparison:comprehensive   # 100 games per match, plus slow tests
npm run test:ai-deployed                    # 400 games per browser-opponent pairing
```
