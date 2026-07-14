# Rust AI Core Tests

Tests for the game logic and AI. For the generated comparison results, see [AI-MATRIX-RESULTS.md](../../../docs/AI-MATRIX-RESULTS.md).

## Running

```bash
cargo test                              # all fast tests (runs in seconds)
cargo test -- --nocapture               # with output
cargo test test_ai_matrix -- --nocapture          # AI-vs-AI matrix
NUM_GAMES=50 cargo test test_ai_matrix -- --nocapture   # more games per match
RUN_SLOW_TESTS=1 cargo test --features slow_tests -- --nocapture # include depth-4 tests
```

From the repo root these are also exposed as `npm run test:rust`, `test:rust:slow`, and `test:ai-comparison:fast`.

## Test layout

- **Unit tests** (`src/`): 100+ tests covering game rules, move generation, evaluation, and each AI type. Fast; run on every build.
- **Integration tests** (`tests/`):

| File                           | Covers                                               | Run                                         |
| ------------------------------ | ---------------------------------------------------- | ------------------------------------------- |
| `ai_matrix_test.rs`            | Compatible AIs; win rates, speed, and rankings       | `cargo test test_ai_matrix -- --nocapture`  |
| `expectiminimax_diagnostic.rs` | Depth-3 game with node, cache-hit, and timing output | `cargo test test_expectiminimax_diagnostic` |
| `genetic_params_comparison.rs` | Default vs evolved parameters                        | `cargo test test_genetic_params_comparison` |
| `rules_conformance.rs`         | Shared TypeScript/Rust legal-move fixtures            | `cargo test shared_rules_fixtures`          |

## Useful environment variables

- `NUM_GAMES` — games per matrix match (default 10)
- `RUN_SLOW_TESTS=1` with `--features slow_tests` — add depth-4 matrix coverage

The AI matrix runs matches in parallel across CPU cores and resets AI state periodically; lower `NUM_GAMES` if you hit memory pressure.
