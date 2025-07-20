# Test Configuration Guide

_Test configuration system for fast development vs comprehensive AI research._

## Overview

Two test modes available:

- **Fast Mode** (default): Depths 1-3, ~5-10 seconds
- **Slow Mode** (optional): Depths 1-4, ~40-60 seconds

## Quick Commands

### Regular Development

```bash
# Run all tests (depths 1-3 only)
npm run check

# Run only Rust tests (depths 1-3 only)
npm run test:rust
```

### AI Research

```bash
# Run all tests including slow tests (depths 1-4)
npm run check:slow

# Run only slow Rust tests (depths 1-4)
npm run test:rust:slow
```

## Configuration

### Environment Variables

- **`RUN_SLOW_TESTS`**: Enables depth 4 testing
- **`NUM_GAMES`**: Games per test (default: 10 fast, 100 slow)

### Rust Features

- **`slow_tests`**: Cargo feature for depth 4 tests

## Test Categories

### Fast Tests (Always Run)

- ✅ Unit tests (36 tests)
- ✅ Basic AI functionality
- ✅ Depths 1-3 performance
- ✅ ML AI diagnostics

### Slow Tests (Optional)

- 🔍 Depth 4 performance analysis
- 🔍 Comprehensive depth comparisons
- 🔍 Extended AI vs AI testing
- 🔍 ML vs Expectiminimax analysis

## Custom Testing

```bash
# Run specific test with slow tests enabled
cd worker/rust_ai_core
RUN_SLOW_TESTS=1 cargo test test_expectiminimax_diagnostic -- --nocapture

# Run with custom number of games
NUM_GAMES=200 RUN_SLOW_TESTS=1 cargo test test_ml_vs_expectiminimax_ai -- --nocapture
```

## CI/CD Configuration

### GitHub Actions

```yaml
# Regular CI runs fast tests
- name: Run Tests
  run: npm run check

# Optional: Run slow tests on main branch
- name: Run Slow Tests (Main Branch)
  if: github.ref == 'refs/heads/main'
  run: npm run check:slow
```

## Performance Comparison

| Mode | Duration | Depths  | Games/Test | Use Case    |
| ---- | -------- | ------- | ---------- | ----------- |
| Fast | 5-10s    | 1,2,3   | 10-50      | Development |
| Slow | 40-60s   | 1,2,3,4 | 50-100     | AI Research |

## Benefits

### For Development

- **Fast feedback**: Tests complete in seconds
- **Quick validation**: Immediate confidence in changes
- **Efficient CI/CD**: Faster build times

### For AI Research

- **Comprehensive analysis**: Full depth range testing
- **Performance insights**: Detailed timing and node analysis
- **Strength comparison**: Complete AI vs AI evaluation

## Troubleshooting

### Tests Running Too Slow

```bash
# Use fast tests for regular development
npm run test:rust
```

### Need Depth 4 Analysis

```bash
# Enable slow tests
npm run test:rust:slow
```

## Related Documentation

- [Testing Strategy](./testing-strategy.md) - Testing approach and methodology
- [Troubleshooting Guide](./troubleshooting.md) - Common issues and solutions
