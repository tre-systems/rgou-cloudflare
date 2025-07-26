# Rust AI Core Tests

This directory contains comprehensive tests for the Royal Game of Ur AI system.

## Test Structure

### **Core Tests** (`src/lib.rs`)

- **50 unit tests** covering fundamental game logic, AI behavior, and edge cases
- Fast execution (< 1 second)
- Run on every build

### **Integration Tests**

#### **1. ai_matrix_test.rs**

**Purpose**: Comprehensive AI comparison and performance evaluation
**Tests**:

- Full matrix comparison of all AI types (Random, Heuristic, EMM Depth 1-4, ML models)
- Performance rankings and win rate analysis
- Speed analysis with move timing
- Enhanced recommendations based on performance data
- AI state reset functionality to prevent memory buildup
- Coordinated testing methodology with alternating first-player advantage

**Features**:

- Tests 10+ AI types including ML models (Fast, V2, V4, Hybrid, PyTorch V5)
- Detailed matrix table showing win rates between all AI pairs
- Performance summary with average win rates
- Speed analysis with move timing categories
- Enhanced recommendations for production use
- Periodic AI state reset (every 20 games) to prevent memory issues

**Usage**:

```bash
# Run with default settings (10 games per match)
cargo test test_ai_matrix -- --nocapture

# Run with custom number of games
NUM_GAMES=50 cargo test test_ai_matrix -- --nocapture

# Include slow tests (Depth 4)
RUN_SLOW_TESTS=1 cargo test test_ai_matrix -- --nocapture
```

#### **2. expectiminimax_diagnostic.rs**

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

#### **3. ml_vs_expectiminimax.rs**

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

#### **4. genetic_params_comparison.rs**

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
- AI Matrix Test with default settings

### **Slow Tests** (Feature Flag)

- Depth 4 testing (when `RUN_SLOW_TESTS=1` or `--features slow_tests`)
- Comprehensive matrix analysis with more games

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
cargo test test_ai_matrix -- --nocapture
cargo test test_expectiminimax_diagnostic
cargo test test_ml_vs_expectiminimax_ai
cargo test test_genetic_params_comparison
```

## Test Results Interpretation

### **Performance Benchmarks** (from AI Matrix Test)

- **EMM-3 (Depth 3)**: Best overall performance (~71% win rate)
- **ML-PyTorch-V5**: Strong ML performance (~60% win rate)
- **ML-V4**: Competitive ML performance (~60% win rate)
- **ML-Fast**: Fast ML alternative (~59% win rate)
- **EMM-2 (Depth 2)**: Strong traditional AI (~58% win rate)
- **ML-V2**: Balanced ML performance (~52% win rate)
- **ML-Hybrid**: Hybrid approach (~52% win rate)
- **Heuristic**: Educational baseline (~49% win rate)
- **EMM-1 (Depth 1)**: Fast baseline (~38% win rate)
- **Random**: Baseline comparison (~1% win rate)

### **Speed Analysis**

- **Random**: ~0ms/move (Very Fast)
- **EMM-1**: ~0ms/move (Very Fast)
- **EMM-2**: ~0ms/move (Very Fast)
- **Heuristic**: ~0ms/move (Very Fast)
- **EMM-3**: ~18ms/move (Moderate)
- **ML-V4**: ~51ms/move (Slow)
- **ML-V2**: ~53ms/move (Slow)
- **ML-PyTorch-V5**: ~57ms/move (Slow)
- **ML-Hybrid**: ~59ms/move (Slow)
- **ML-Fast**: ~61ms/move (Slow)

## **Recommendations**

Based on AI Matrix Test results:

- **Production**: EMM-3 (Depth 3) - Best overall performance and ready for production
- **Real-time**: EMM-1/2 - Very fast and suitable for interactive play
- **ML Alternative**: ML-PyTorch-V5 - Strong ML performance
- **Educational**: Heuristic AI - Good for understanding game strategy
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

- AI Matrix Test is comprehensive but can be slow with many games
- Focus on targeted performance benchmarks
- Use feature flags for slow tests
- Keep regular test suite under 10 seconds

## Troubleshooting

### **Common Issues**

- **Inconsistent Results**: Check random seeding
- **Slow Tests**: Use feature flags to skip depth 4
- **ML AI Failures**: Ensure weights file is present
- **Memory Issues**: AI Matrix Test includes automatic state reset

### **Debug Mode**

```bash
RUST_LOG=debug cargo test -- --nocapture
```

## Recent Changes

### **Test Consolidation** (Latest)

- **Removed**: `coordinated_ai_test.rs` - functionality consolidated into AI Matrix Test
- **Enhanced**: `ai_matrix_test.rs` - now includes:
  - AI state reset functionality
  - Enhanced game result tracking
  - Improved recommendations generation
  - Coordinated testing methodology
  - Better performance analysis

The AI Matrix Test now provides all the functionality of the previous Coordinated AI Test while maintaining the comprehensive comparison capabilities.
