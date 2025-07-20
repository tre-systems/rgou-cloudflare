# Testing Strategy

_Testing approach and methodology for the Royal Game of Ur project._

## Test Overview

| Test Type         | What to Test                | Tool       | Value  | Maintenance |
| ----------------- | --------------------------- | ---------- | ------ | ----------- |
| Pure logic        | Game rules, reducers        | Vitest     | High   | Low         |
| Schema validation | Zod schemas, domain types   | Vitest     | High   | Low         |
| Snapshots         | Key game states             | Vitest     | Medium | Low         |
| Store integration | Zustand actions/transitions | Vitest     | Medium | Medium      |
| UI smoke          | App loads, basic flows      | Playwright | Medium | Low         |
| Full E2E          | Full game, random flows     | Avoid      | Low    | High        |

## Philosophy

- Focus on high-value, low-maintenance tests
- Prefer deterministic, pure function tests
- Use integration tests for workflows
- Use snapshot tests for regression

## Test Categories

### Unit Tests

- **Location**: `src/lib/__tests__/game-logic.test.ts`
- **Purpose**: Test pure functions and business logic
- **Benefits**: Fast, deterministic, high confidence

### Schema Validation

- **Location**: `src/lib/__tests__/schemas.test.ts`
- **Purpose**: Test Zod schemas and type safety
- **Benefits**: Catches data issues early

### AI Tests

- **Location**: `src/lib/__tests__/ai-deterministic.test.ts`
- **Purpose**: Test AI behavior in specific scenarios
- **Benefits**: No randomness, verifies strategy

### Integration Tests

- **Location**: `src/lib/__tests__/game-store.test.ts`
- **Purpose**: Test game store, move sequences, AI integration

### Rust Tests

- **Location**: `worker/rust_ai_core/src/lib.rs`, `worker/rust_ai_core/tests/`
- **Purpose**: Test core AI and game logic

## What We DON'T Test

- Full game playthroughs (too slow, fragile)
- UI component tests (high maintenance, low value)
- Random dice roll tests (non-deterministic)
- Performance tests (environment-dependent)

## Running Tests

```bash
# Development
npm run test:watch

# CI/CD
npm run test

# Coverage
npm run test:coverage

# All checks (including Rust)
npm run check

# Quick tests (10 games)
npm run test:rust:quick

# Comprehensive tests (100 games)
npm run test:rust:slow
```

## Test Configuration

### Standard Test Configuration

- **Games**: 100 per model comparison
- **Opponent**: Expectiminimax AI (Depth 3)
- **Turn Order**: Alternating (50 games each)
- **Environment**: Consistent hardware and software
- **Validation**: Multiple test runs for reliability

### Test Commands

```bash
# Test specific model
NUM_GAMES=100 cargo test test_ml_v2_vs_expectiminimax_ai -- --nocapture

# Test all models
npm run test:rust

# Quick tests (10 games)
cargo test test_ml_v2_vs_expectiminimax_ai -- --nocapture
```

## E2E Testing

### Smoke Tests

- **Location**: `e2e/smoke.spec.ts`
- **Coverage**: Critical user flows, mobile layout, game completion
- **Database**: Verifies actual database saves (local SQLite)

### Running E2E

```bash
# Run E2E tests
npm run test:e2e

# Debug with UI
npm run test:e2e:ui
```

### Best Practices

- Use `data-testid` attributes for robust selectors
- Focus on critical flows, avoid edge cases
- Verify actual database saves, don't mock

## AI Performance Testing

### Test Matrix Results

All tests conducted with 100 games vs Expectiminimax AI (Depth 3) unless otherwise specified.

### ML AI Models Performance

| Model      | Win Rate | Losses | Avg Moves | Speed | First/Second | Status               |
| ---------- | -------- | ------ | --------- | ----- | ------------ | -------------------- |
| **v2**     | **44%**  | 56%    | 152.3     | 0.7ms | 23/21        | ✅ **Best**          |
| **Fast**   | 36%      | 64%    | 172.1     | 0.7ms | 11/25        | Competitive          |
| **v4**     | 32%      | 68%    | 147.9     | 0.7ms | 15/17        | ⚠️ Needs Improvement |
| **Hybrid** | 30%      | 70%    | 173.7     | 0.7ms | 9/21         | ⚠️ Needs Improvement |

### Performance Insights

#### 🏆 **v2 Model - Best Performance**

- **Win Rate**: 44% (44 wins, 56 losses)
- **Training**: 1,000 games, 50 epochs, depth 3
- **Architecture**: 150 inputs, enhanced network
- **Key Strength**: Balanced performance regardless of turn order
- **Recommendation**: Use for production

#### 🥈 **Fast Model - Competitive**

- **Win Rate**: 36% (36 wins, 64 losses)
- **Training**: 500 games, 25 epochs, depth 2
- **Architecture**: 100 inputs, basic network
- **Key Strength**: Better when playing second
- **Recommendation**: Good baseline model

#### ⚠️ **v4 Model - Training Regression**

- **Win Rate**: 32% (32 wins, 68 losses)
- **Training**: 5,000 games, 100 epochs, depth 3
- **Architecture**: 150 inputs, production training
- **Issue**: Despite excellent validation loss (0.707), competitive performance is poor
- **Recommendation**: Investigate training methodology

#### ⚠️ **Hybrid Model - Performance Issues**

- **Win Rate**: 30% (30 wins, 70 losses)
- **Training**: 10,000 games, 100 epochs, depth 3
- **Architecture**: Hybrid Rust+Python training
- **Issue**: Worst performance despite most training data
- **Recommendation**: Revisit training approach

## Common Test Issues

### E2E Tests Failing

**Solution:**

```bash
# Install Playwright browsers
npx playwright install --with-deps

# Run with UI for debugging
npm run test:e2e:ui
```

### Unit Tests Failing

**Solution:**

```bash
npm run test:coverage
npm install
```

### Rust Tests Failing

**Solution:**

```bash
# Build WASM assets first
npm run build:wasm-assets

# Run Rust tests
npm run test:rust
```

## Quick Fixes

| Issue            | Quick Fix                   |
| ---------------- | --------------------------- |
| WASM not loading | `npm run build:wasm-assets` |
| Tests failing    | `npm run nuke`              |
| E2E broken       | `npx playwright install`    |
| Rust tests fail  | `cargo clean && cargo test` |

## Related Documentation

- [Troubleshooting Guide](./troubleshooting.md) - Common issues and solutions
- [Architecture Overview](./architecture-overview.md) - System design
