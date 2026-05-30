# Rust AI Core Tests

Tests for the game logic and AI. For the generated comparison results, see [AI-MATRIX-RESULTS.md](../../../docs/AI-MATRIX-RESULTS.md).

## Running

```bash
cargo test                              # all fast tests (runs in seconds)
cargo test -- --nocapture               # with output
cargo test test_ai_matrix -- --nocapture          # AI-vs-AI matrix
NUM_GAMES=50 cargo test test_ai_matrix -- --nocapture   # more games per match
cargo test --features slow_tests -- --nocapture   # include depth-4 / slow tests
```

From the repo root these are also exposed as `npm run test:rust`, `test:rust:slow`, and `test:ai-comparison:fast`.

## Test layout

- **Unit tests** (`src/`): 100+ tests covering game rules, move generation, evaluation, and each AI type. Fast; run on every build.
- **Integration tests** (`tests/`):

| File                           | Covers                                               | Run                                         |
| ------------------------------ | ---------------------------------------------------- | ------------------------------------------- |
| `ai_matrix_test.rs`            | Every AI vs every AI; win rates, speed, and rankings | `cargo test test_ai_matrix -- --nocapture`  |
| `expectiminimax_diagnostic.rs` | Depth comparison, transposition table, alpha-beta    | `cargo test test_expectiminimax_diagnostic` |
| `ml_vs_expectiminimax.rs`      | ML AI vs expectiminimax, fixed dice sequences        | `cargo test test_ml_vs_expectiminimax_ai`   |
| `genetic_params_comparison.rs` | Default vs evolved parameters                        | `cargo test test_genetic_params_comparison` |

## Useful environment variables

- `NUM_GAMES` — games per matrix match (default 10)
- `RANDOM_SEED` — fixed seed for reproducible runs
- `RUN_SLOW_TESTS=1` with `--features slow_tests` — enable depth-4 and extended tests

The AI matrix runs matches in parallel across CPU cores and resets AI state periodically; lower `NUM_GAMES` if you hit memory pressure.
