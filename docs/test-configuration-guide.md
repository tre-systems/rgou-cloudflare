# Test Configuration Guide

This document explains the test configuration system that allows running fast tests for regular development while keeping comprehensive slow tests available for AI improvement work.

## Overview

The test system has been optimized to provide two modes:

- **Fast Mode** (default): Runs tests with depths 1-3 only, suitable for regular development
- **Slow Mode** (optional): Runs all tests including depth 4, suitable for AI improvement research

## Test Scripts

### Regular Development (Fast Tests)

```bash
# Run all tests including Rust tests (depths 1-3 only)
npm run check

# Run only Rust tests (depths 1-3 only)
npm run test:rust
```

### AI Improvement Research (Slow Tests)

```bash
# Run all tests including slow Rust tests (depths 1-4)
npm run check:slow

# Run only slow Rust tests (depths 1-4)
npm run test:rust:slow
```

## Configuration Details

### Environment Variables

- **`RUN_SLOW_TESTS`**: When set to any value, enables depth 4 testing
- **`NUM_GAMES`**: Controls number of games in AI vs AI tests (default: 10 for fast, 100 for slow)

### Rust Features

- **`slow_tests`**: Cargo feature that enables depth 4 tests and comprehensive analysis

### Test Files Modified

#### 1. `worker/rust_ai_core/tests/ai_simulation.rs`

```rust
// Only run depth 4 comparisons if RUN_SLOW_TESTS environment variable is set
let comparisons = if std::env::var("RUN_SLOW_TESTS").is_ok() {
    vec![(1, 4), (2, 4), (3, 4)]
} else {
    vec![(1, 3), (2, 3)] // Skip depth 4 tests for regular runs
};
```

#### 2. `worker/rust_ai_core/tests/expectiminimax_diagnostic.rs`

```rust
// Only test depth 4 if RUN_SLOW_TESTS is set
let depths = if std::env::var("RUN_SLOW_TESTS").is_ok() {
    vec![1, 2, 3, 4]
} else {
    vec![1, 2, 3] // Skip depth 4 for regular runs
};
```

#### 3. `worker/rust_ai_core/tests/ml_vs_expectiminimax.rs`

```rust
const EXPECTIMINIMAX_SEARCH_DEPTH: u8 = if cfg!(feature = "slow_tests") { 4 } else { 3 };

#[test]
#[cfg_attr(not(feature = "slow_tests"), ignore)]
fn test_expectiminimax_depth4_vs_ml_comprehensive() {
    // This test only runs with slow_tests feature
}
```

## Performance Comparison

### Fast Tests (Regular Development)

- **Duration**: ~5-10 seconds
- **Depths Tested**: 1, 2, 3
- **Games per Test**: 10-50
- **Suitable for**: Daily development, CI/CD, quick validation

### Slow Tests (AI Research)

- **Duration**: ~40-60 seconds
- **Depths Tested**: 1, 2, 3, 4
- **Games per Test**: 50-100
- **Suitable for**: AI improvement research, performance analysis, comprehensive validation

## Usage Examples

### Daily Development Workflow

```bash
# Quick validation during development
npm run test:rust

# Full check before committing
npm run check
```

### AI Improvement Research

```bash
# Comprehensive testing for AI improvements
npm run test:rust:slow

# Full slow test suite
npm run check:slow
```

### Custom Testing

```bash
# Run specific test with slow tests enabled
cd worker/rust_ai_core
RUN_SLOW_TESTS=1 cargo test test_expectiminimax_diagnostic -- --nocapture

# Run with custom number of games
NUM_GAMES=200 RUN_SLOW_TESTS=1 cargo test test_ml_vs_expectiminimax_ai -- --nocapture
```

## CI/CD Configuration

### GitHub Actions (Recommended)

```yaml
# Regular CI runs fast tests
- name: Run Tests
  run: npm run check

# Optional: Run slow tests on main branch
- name: Run Slow Tests (Main Branch)
  if: github.ref == 'refs/heads/main'
  run: npm run check:slow
```

### Local Development

```bash
# Regular development
npm run check

# When working on AI improvements
npm run check:slow
```

## Test Categories

### Fast Tests (Always Run)

- ✅ Unit tests (36 tests)
- ✅ Basic AI functionality
- ✅ Depths 1-3 performance
- ✅ ML AI diagnostics
- ✅ Basic AI vs AI (depths 1-3)

### Slow Tests (Optional)

- 🔍 Depth 4 performance analysis
- 🔍 Comprehensive depth comparisons
- 🔍 Extended AI vs AI testing
- 🔍 ML vs Expectiminimax depth analysis
- 🔍 Detailed performance benchmarks

## Benefits

### For Regular Development

- **Fast feedback**: Tests complete in seconds
- **Quick validation**: Immediate confidence in changes
- **Efficient CI/CD**: Faster build times
- **Focus on core functionality**: Tests what matters most

### For AI Research

- **Comprehensive analysis**: Full depth range testing
- **Performance insights**: Detailed timing and node analysis
- **Strength comparison**: Complete AI vs AI evaluation
- **Research validation**: Thorough testing for improvements

## Troubleshooting

### Tests Running Too Slow

```bash
# Use fast tests for regular development
npm run test:rust
```

### Need Depth 4 Analysis

```bash
# Enable slow tests for comprehensive analysis
npm run test:rust:slow
```

### Custom Test Configuration

```bash
# Set custom number of games
NUM_GAMES=50 npm run test:rust

# Enable slow tests with custom games
NUM_GAMES=200 npm run test:rust:slow
```

## Best Practices

1. **Use fast tests for regular development**
2. **Use slow tests only when working on AI improvements**
3. **Run slow tests before major AI changes**
4. **Use custom game counts for specific research needs**
5. **Keep CI/CD fast with regular tests only**

## Summary

The test configuration system provides:

- **Fast, reliable testing** for daily development
- **Comprehensive analysis** for AI improvement research
- **Flexible configuration** for different use cases
- **Clear separation** between development and research needs

This ensures efficient development while maintaining the ability to perform thorough AI analysis when needed.
