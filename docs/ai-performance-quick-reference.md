# AI Performance Quick Reference

## AI Types Overview

### 1. Expectiminimax AI

- **Algorithm**: Expectiminimax with alpha-beta pruning
- **Search Depth**: Configurable (1-4)
- **Performance**: 0.0ms/move at depth 1, 10.2ms/move at depth 3
- **Strength**: Strong strategic play
- **Use Case**: Production gameplay

### 2. Heuristic AI

- **Algorithm**: Immediate position evaluation only
- **Search Depth**: 0 (no depth search)
- **Performance**: < 1ms/move
- **Strength**: Competitive (50.8% overall win rate)
- **Use Case**: Baseline testing, educational purposes

### 3. ML AI

- **Algorithm**: Neural network evaluation
- **Search Depth**: 0 (no depth search)
- **Performance**: 40.8ms/move
- **Strength**: Weak (46.8% overall win rate)
- **Use Case**: Research, comparison

### 4. Random AI

- **Algorithm**: Random move selection
- **Search Depth**: 0 (no search)
- **Performance**: < 1ms/move
- **Strength**: Weak (48.0% overall win rate)
- **Use Case**: Baseline testing

## Matrix Analysis Results (Latest July 19, 2025)

### Overall AI Ranking (by win rate)

1. **EMM-1**: 53.6% (0.0ms/move) - Best performance/speed ratio
2. **EMM-2**: 53.2% (0.0ms/move) - Strong alternative
3. **Heuristic**: 50.8% (0.0ms/move) - Competitive baseline
4. **Random**: 48.0% (0.0ms/move) - Expected baseline
5. **EMM-3**: 47.6% (10.2ms/move) - Diminishing returns
6. **ML**: 46.8% (40.8ms/move) - Needs improvement

### Complete Performance Matrix (Win Rates %)

| AI Type       | Random | Heuristic | EMM-1 | EMM-2 | EMM-3 | ML   |
| ------------- | ------ | --------- | ----- | ----- | ----- | ---- |
| **Random**    | -      | 48.0      | 44.0  | 50.0  | 50.0  | 48.0 |
| **Heuristic** | 48.0   | -         | 48.0  | 48.0  | 56.0  | 50.0 |
| **EMM-1**     | 44.0   | 48.0      | -     | 48.0  | 48.0  | 64.0 |
| **EMM-2**     | 50.0   | 48.0      | 48.0  | -     | 54.0  | 58.0 |
| **EMM-3**     | 50.0   | 56.0      | 48.0  | 54.0  | -     | 46.0 |
| **ML**        | 48.0   | 50.0      | 64.0  | 58.0  | 46.0  | -    |

### Key Insights

- **EMM-1 is optimal** for production use
- **Depth search crucial** but diminishing returns beyond depth 2
- **ML AI underperforms** and needs improvement
- **Game has significant luck component** (Random achieves 48% vs expectiminimax)
- **Tactical evaluation > Deep search** for this game

## Expectiminimax AI Configuration

### Recommended Settings

| Use Case                     | Depth | Performance | Win Rate vs Random | Win Rate vs ML AI |
| ---------------------------- | ----- | ----------- | ------------------ | ----------------- |
| **Production (Recommended)** | 3     | 14.1ms/game | 100%               | 74%               |
| **Fast Play**                | 2     | 0.0ms/game  | 98%                | 54%               |
| **Maximum Strength**         | 3     | 14.1ms/game | 100%               | 74%               |

### Configuration Files

- **Server-side**: `worker/src/lib.rs` - `AI_SEARCH_DEPTH: u8 = 3`
- **WASM API**: `worker/rust_ai_core/src/wasm_api.rs` - Depth 3
- **Client-side**: `src/lib/game-store.ts` - `searchDepth: 3`
- **Tests**: `worker/rust_ai_core/tests/` - Various test configurations

## Performance Metrics

### Timing Benchmarks

| Operation       | Depth 1 | Depth 2 | Depth 3 | Depth 4 |
| --------------- | ------- | ------- | ------- | ------- |
| Single Move     | 0.0ms   | 0.0ms   | 10.2ms  | 279.6ms |
| Full Game       | 0.0ms   | 0.0ms   | 10.2ms  | 279.6ms |
| Nodes Evaluated | 0       | 7       | 189     | 2,960   |

### Transposition Table Performance

- **Speedup**: Up to 13,658x for repeated positions
- **Memory Usage**: Automatic growth with HashMap
- **Cache Hit Rate**: >80% for typical games
- **Effectiveness**: 0% in alpha-beta pruning (expected)

## Testing Commands

### Run All AI Tests

```bash
npm run check
```

### Run Matrix Comparison Tests

```bash
# Run comprehensive matrix analysis (slow tests)
npm run test:rust:slow

# Run fast tests only
npm run test:rust
```

### Run Specific AI Tests

```bash
# Comprehensive AI matrix analysis
cd worker/rust_ai_core && cargo test test_comprehensive_ai_matrix -- --nocapture

# Expectiminimax diagnostic tests
cd worker/rust_ai_core && cargo test test_expectiminimax_diagnostic -- --nocapture

# AI vs AI comparison tests
cd worker/rust_ai_core && cargo test test_ai_vs_ai_simulation -- --nocapture

# Heuristic AI tests
cd worker/rust_ai_core && cargo test test_heuristic_ai_comprehensive_analysis -- --nocapture

# Heuristic vs Expectiminimax tests
cd worker/rust_ai_core && cargo test test_heuristic_ai_vs_expectiminimax -- --nocapture

# ML vs Expectiminimax tests
cd worker/rust_ai_core && cargo test test_expectiminimax_depth4_vs_ml_comprehensive -- --nocapture
```

### Performance Testing

```bash
# Run comprehensive analysis
cd worker/rust_ai_core && cargo test test_expectiminimax_vs_ml_comprehensive_analysis -- --nocapture
```

## Optimization Features

### Implemented Optimizations

1. **Enhanced Evaluation Function**
   - 20% faster state evaluation
   - Reduced memory allocations
   - Efficient piece counting

2. **Move Ordering**
   - Better alpha-beta pruning
   - Improved search efficiency
   - Smart move prioritization

3. **Transposition Table**
   - Hash-based caching
   - Depth-aware validation
   - Memory-efficient storage

4. **Quiescence Search**
   - Reduced depth (4→3)
   - Capture-focused analysis
   - Better tactical evaluation

## Troubleshooting

### Common Issues

1. **Slow Performance**
   - Check transposition table size
   - Verify depth configuration
   - Monitor memory usage

2. **Inconsistent Results**
   - Clear transposition table
   - Check for hash collisions
   - Verify move ordering

3. **Memory Issues**
   - Monitor transposition table growth
   - Consider table size limits
   - Implement cleanup strategies

### Debug Commands

```bash
# Check AI performance
cd worker/rust_ai_core && cargo test test_expectiminimax_diagnostic -- --nocapture

# Verify consistency
cd worker/rust_ai_core && cargo test test_ml_ai_consistency -- --nocapture

# Test specific depth
cd worker/rust_ai_core && cargo test test_ai_vs_ai_simulation -- --nocapture
```

## Best Practices

### For Production Use

1. **Use Depth 1** for optimal balance (53.6% win rate, instant speed)
2. **Enable transposition table** for speedup
3. **Monitor performance** regularly
4. **Test thoroughly** before deployment

### For Development

1. **Use Depth 2** for fast iteration
2. **Clear transposition table** between tests
3. **Run diagnostic tests** regularly
4. **Monitor memory usage** during long sessions

### For Testing

1. **Use fixed dice sequences** for reproducibility
2. **Run multiple games** for statistical significance
3. **Compare against ML AI** for validation
4. **Document performance changes**

## Key Files

### Core Implementation

- `worker/rust_ai_core/src/lib.rs` - Main AI implementation
- `worker/rust_ai_core/src/wasm_api.rs` - WASM interface
- `src/lib/wasm-ai-service.ts` - TypeScript wrapper

### Tests

- `worker/rust_ai_core/tests/expectiminimax_diagnostic.rs` - Diagnostic tests
- `worker/rust_ai_core/tests/ai_simulation.rs` - AI vs AI tests
- `worker/rust_ai_core/tests/ml_vs_expectiminimax.rs` - ML comparison tests
- `worker/rust_ai_core/tests/ai_matrix_analysis.rs` - Matrix analysis tests

### Configuration

- `worker/src/lib.rs` - Server-side depth setting
- `src/lib/game-store.ts` - Client-side depth setting
- `worker/rust_ai_core/src/wasm_api.rs` - WASM depth validation

---

_Last updated: July 19, 2025 - Latest matrix comparison test results_
_Test command: `npm run test:rust:slow`_
