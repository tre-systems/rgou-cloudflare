# Rust AI Core Tests

This directory contains comprehensive tests for the Royal Game of Ur AI system.

## 🚀 Quick Start

### For Newcomers

If you're new to the project and want to run tests:

```bash
# 1. Run all tests (fast)
cargo test

# 2. Run tests with output
cargo test -- --nocapture

# 3. Run AI comparison tests
cargo test test_ai_matrix -- --nocapture

# 4. Run specific test
cargo test test_ml_v2_vs_expectiminimax_ai -- --nocapture
```

### Prerequisites

- **Rust & Cargo** installed
- **wasm-pack** for WebAssembly builds
- **Node.js** for npm scripts (optional)

## 📊 Test Overview

### What Gets Tested

- **Game Logic**: Core game rules and mechanics
- **AI Behavior**: All AI types (Classic, ML, Random, Heuristic)
- **Performance**: Speed and win rate analysis
- **Integration**: End-to-end functionality

### Test Categories

| Category       | Purpose            | Speed           | When to Run         |
| -------------- | ------------------ | --------------- | ------------------- |
| **Unit Tests** | Core functionality | Fast (<1s)      | Every build         |
| **AI Matrix**  | AI comparison      | Medium (1-5min) | Before releases     |
| **Slow Tests** | Deep analysis      | Slow (5-15min)  | Performance testing |

## 🧪 Test Structure

### **Core Tests** (`src/lib.rs`)

- **50 unit tests** covering fundamental game logic, AI behavior, and edge cases
- Fast execution (< 1 second)
- Run on every build

### **Integration Tests**

#### **1. ai_matrix_test.rs** (Most Important)

**Purpose**: Comprehensive AI comparison and performance evaluation

**What it tests**:

- Full matrix comparison of all AI types
- Performance rankings and win rate analysis
- Speed analysis with move timing
- Enhanced recommendations based on performance data

**Quick run**:

```bash
# Default (10 games per match)
cargo test test_ai_matrix -- --nocapture

# More games (50 per match)
NUM_GAMES=50 cargo test test_ai_matrix -- --nocapture
```

#### **2. expectiminimax_diagnostic.rs**

**Purpose**: Core AI diagnostics and performance benchmarks

**What it tests**:

- Basic AI functionality validation
- Depth performance comparison (1, 2, 3)
- Transposition table effectiveness
- Alpha-beta pruning verification

**Quick run**:

```bash
cargo test test_expectiminimax_diagnostic
```

#### **3. ml_vs_expectiminimax.rs**

**Purpose**: ML AI vs Expectiminimax comparisons

**What it tests**:

- ML AI consistency validation
- ML vs EMM performance comparison
- Fixed dice sequence testing

**Quick run**:

```bash
cargo test test_ml_vs_expectiminimax_ai
```

#### **4. genetic_params_comparison.rs**

**Purpose**: Parameter optimization testing

**What it tests**:

- Default vs evolved parameter comparison
- Performance impact analysis

**Quick run**:

```bash
cargo test test_genetic_params_comparison
```

## 🏃‍♂️ Running Tests

### **Quick Tests** (Recommended for Development)

```bash
# Run all fast tests
cargo test

# Run with output
cargo test -- --nocapture
```

### **AI Comparison Tests** (Before Releases)

```bash
# Quick comparison (10 games per match)
cargo test test_ai_matrix -- --nocapture

# Comprehensive comparison (50 games per match)
NUM_GAMES=50 cargo test test_ai_matrix -- --nocapture
```

### **Slow Tests** (Performance Analysis)

```bash
# Include depth 4 testing
RUN_SLOW_TESTS=1 cargo test --features slow_tests

# Or use feature flag
cargo test --features slow_tests
```

### **Individual Test Files**

```bash
# AI Matrix Test
cargo test test_ai_matrix -- --nocapture

# Expectiminimax diagnostics
cargo test test_expectiminimax_diagnostic

# ML vs EMM comparison
cargo test test_ml_vs_expectiminimax_ai

# Genetic parameter comparison
cargo test test_genetic_params_comparison
```

## 📈 Test Results

### **Performance Benchmarks** (Latest Results)

| AI Type             | Win Rate  | Speed   | Status              |
| ------------------- | --------- | ------- | ------------------- |
| **EMM-3 (Depth 3)** | **71.8%** | 17.1ms  | ✅ **Best Overall** |
| **PyTorch V5**      | **63.3%** | 65.0ms  | ✅ **Best ML**      |
| **ML-V2**           | **60.4%** | 58.5ms  | ✅ **Strong ML**    |
| **ML-Fast**         | **59.3%** | 65.5ms  | ✅ **Good ML**      |
| **ML-V4**           | **56.7%** | 56.0ms  | ✅ **Good ML**      |
| **EMM-2 (Depth 2)** | **56.4%** | 0.1ms   | ✅ **Fast**         |
| **Heuristic**       | **35.6%** | Instant | 📚 **Educational**  |
| **Random**          | **~3%**   | Instant | 🧪 **Baseline**     |

### **Speed Categories**

- **Very Fast**: <1ms/move (Random, Heuristic, EMM-1/2)
- **Moderate**: 10-50ms/move (EMM-3, ML-V4)
- **Slow**: >50ms/move (ML models)

## 🎯 Recommendations

Based on test results:

- **Production**: EMM-3 (Depth 3) - Best overall performance
- **Real-time**: EMM-1/2 - Very fast and suitable for interactive play
- **ML Alternative**: PyTorch V5 - Strong ML performance
- **Educational**: Heuristic AI - Good for understanding game strategy
- **Testing**: Random AI - Baseline comparison

## 🔧 Troubleshooting

### **Common Issues**

**Inconsistent Results**:

```bash
# Check random seeding
RANDOM_SEED=12345 cargo test test_ai_matrix -- --nocapture
```

**Slow Tests**:

```bash
# Use fewer games for faster testing
NUM_GAMES=5 cargo test test_ai_matrix -- --nocapture
```

**ML AI Failures**:

```bash
# Check if weights file exists
ls ml/data/weights/
```

**Memory Issues**:

```bash
# AI Matrix Test includes automatic state reset every 20 games
# If still having issues, reduce NUM_GAMES
```

### **Debug Mode**

```bash
# Enable debug logging
RUST_LOG=debug cargo test -- --nocapture
```

## 📝 Adding New Tests

### **Unit Tests** (Add to `src/lib.rs`)

```rust
#[test]
fn test_new_feature() {
    // Test implementation
    assert_eq!(expected, actual);
}
```

### **Integration Tests** (Create new file)

```rust
// tests/new_test.rs
use rgou_ai_core::*;

#[test]
fn test_new_integration() {
    // Test implementation
}
```

### **Best Practices**

1. **Use seeded random** for reproducible results
2. **Keep tests focused** and fast
3. **Document expected outcomes** clearly
4. **Use feature flags** for slow tests

## 📊 Performance Considerations

- **AI Matrix Test** is comprehensive but can be slow with many games
- **Focus on targeted benchmarks** for specific scenarios
- **Use feature flags** for slow tests
- **Keep regular test suite** under 10 seconds

## 🔄 Recent Changes

### **Test Consolidation** (Latest)

- **Removed**: `coordinated_ai_test.rs` - functionality consolidated into AI Matrix Test
- **Enhanced**: `ai_matrix_test.rs` - now includes:
  - AI state reset functionality
  - Enhanced game result tracking
  - Improved recommendations generation
  - Coordinated testing methodology
  - Better performance analysis

The AI Matrix Test now provides all the functionality of the previous Coordinated AI Test while maintaining the comprehensive comparison capabilities.
