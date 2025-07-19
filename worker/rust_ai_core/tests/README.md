# Rust AI Core Tests

This directory contains comprehensive tests for the Royal Game of Ur AI system.

## Test Structure

### **Core Tests** (`src/lib.rs`)

- **50 unit tests** covering fundamental game logic, AI behavior, and edge cases
- Fast execution (< 1 second)
- Run on every build

### **Integration Tests**

#### **1. expectiminimax_diagnostic.rs**

**Purpose**: Core AI diagnostics and performance benchmarks
**Tests**:

- Basic AI functionality validation
- Depth performance comparison (1, 2, 3)
- Transposition table effectiveness
- Alpha-beta pruning verification
- Move ordering analysis
- Quiescence search testing

**Usage**:

```bash
cargo test test_expectiminimax_diagnostic
```

#### **2. ml_vs_expectiminimax.rs**

**Purpose**: ML AI vs Expectiminimax comparisons and diagnostics
**Tests**:

- ML AI consistency validation
- ML vs EMM performance comparison
- Fixed dice sequence testing
- AI diagnostics and move analysis

**Usage**:

```bash
cargo test test_ml_vs_expectiminimax_ai
cargo test test_ml_ai_consistency
```

#### **3. genetic_params_comparison.rs**

**Purpose**: Parameter optimization and genetic algorithm testing
**Tests**:

- Default vs evolved parameter comparison
- Performance impact analysis
- Parameter tuning validation

**Usage**:

```bash
cargo test test_genetic_params_comparison
```

## Test Categories

### **Fast Tests** (Default)

- All unit tests in `src/lib.rs`
- Basic diagnostics in `expectiminimax_diagnostic.rs`
- ML AI consistency tests
- Genetic parameter comparison

### **Slow Tests** (Feature Flag)

- Depth 4 testing (when `RUN_SLOW_TESTS=1` or `--features slow_tests`)
- Comprehensive matrix analysis (removed - too slow and inconsistent)

## Running Tests

### **Regular Test Suite** (Recommended)

```bash
cargo test
```

### **With Output**

```bash
cargo test -- --nocapture
```

### **Slow Tests Only**

```bash
RUN_SLOW_TESTS=1 cargo test --features slow_tests
```

### **Individual Test Files**

```bash
cargo test test_expectiminimax_diagnostic
cargo test test_ml_vs_expectiminimax_ai
cargo test test_genetic_params_comparison
```

## Test Results Interpretation

### **Performance Benchmarks**

- **EMM-3 (Depth 3)**: Best overall performance (~82% win rate)
- **EMM-2 (Depth 2)**: Strong alternative (~63% win rate)
- **ML AI**: Competitive performance (~60% win rate)
- **EMM-1 (Depth 1)**: Fast baseline (~53% win rate)
- **Heuristic**: Educational baseline (~35% win rate)

### **Speed Analysis**

- **EMM-1**: ~0ms/move (instant)
- **EMM-2**: ~0ms/move (instant)
- **EMM-3**: ~14ms/move (moderate)
- **ML AI**: ~58ms/move (slower)
- **Heuristic**: ~0ms/move (instant)

## **Recommendations**

Based on test results:

- **Production**: EMM-3 (Depth 3) - Best overall performance
- **Alternative**: EMM-2 (Depth 2) - Strong alternative
- **Educational**: Heuristic AI - Good for understanding
- **Testing**: Random AI - Baseline comparison

## Maintenance

### **Adding New Tests**

1. Add unit tests to `src/lib.rs` for core functionality
2. Create integration test file for complex scenarios
3. Use consistent random seeding for reproducible results
4. Keep tests focused and fast

### **Test Data**

- Use seeded random number generators for consistency
- Avoid hardcoded game states when possible
- Document expected outcomes clearly

### **Performance Considerations**

- Matrix analysis tests are expensive and removed
- Focus on targeted performance benchmarks
- Use feature flags for slow tests
- Keep regular test suite under 10 seconds

## Troubleshooting

### **Common Issues**

- **Inconsistent Results**: Check random seeding
- **Slow Tests**: Use feature flags to skip depth 4
- **ML AI Failures**: Ensure weights file is present
- **Memory Issues**: Clear transposition tables between tests

### **Debug Mode**

```bash
RUST_LOG=debug cargo test -- --nocapture
```
