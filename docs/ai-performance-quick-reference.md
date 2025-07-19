# AI Performance Quick Reference

## AI Types Overview

### 1. Expectiminimax AI

- **Algorithm**: Expectiminimax with alpha-beta pruning
- **Search Depth**: Configurable (1-4)
- **Performance**: 2.4ms/move at depth 3
- **Strength**: Strong strategic play
- **Use Case**: Production gameplay

### 2. Heuristic AI

- **Algorithm**: Immediate position evaluation only
- **Search Depth**: 0 (no depth search)
- **Performance**: < 1ms/move
- **Strength**: Weak (4-12% win rate vs expectiminimax)
- **Use Case**: Baseline testing, educational purposes

### 3. ML AI

- **Algorithm**: Neural network evaluation
- **Search Depth**: 0 (no depth search)
- **Performance**: 39.9ms/move
- **Strength**: Competitive (52.8% overall win rate)
- **Use Case**: Research, comparison

### 4. Random AI

- **Algorithm**: Random move selection
- **Search Depth**: 0 (no search)
- **Performance**: < 1ms/move
- **Strength**: Weak (39.2% overall win rate)
- **Use Case**: Baseline testing

## Matrix Analysis Results

### Overall AI Ranking (by win rate)
1. **EMM-1**: 56.4% (0.0ms/move) - Best performance/speed ratio
2. **EMM-2**: 53.2% (0.0ms/move) - Strong alternative
3. **ML**: 52.8% (39.9ms/move) - Competitive but slow
4. **EMM-3**: 51.2% (10.7ms/move) - Diminishing returns
5. **Heuristic**: 47.2% (0.0ms/move) - Fast but weak
6. **Random**: 39.2% (0.0ms/move) - Baseline

### Key Insights
- **EMM-1 is optimal** for production use
- **Depth search crucial** but diminishing returns beyond depth 2
- **ML AI competitive** but needs speed optimization
- **Game has significant luck component** (Random achieves 48-50% vs expectiminimax)

## Expectiminimax AI Configuration

### Recommended Settings

| Use Case                     | Depth | Performance  | Win Rate vs Random | Win Rate vs ML AI |
| ---------------------------- | ----- | ------------ | ------------------ | ----------------- |
| **Production (Recommended)** | 3     | 11.4ms/game  | 94%                | 49%               |
| **Fast Play**                | 2     | 0.6ms/game   | 94%                | 98%               |
| **Maximum Strength**         | 4     | 308.8ms/game | 96%                | 75%               |

### Configuration Files

- **Server-side**: `worker/src/lib.rs` - `AI_SEARCH_DEPTH: u8 = 3`
- **WASM API**: `worker/rust_ai_core/src/wasm_api.rs` - Depth 3
- **Client-side**: `src/lib/game-store.ts` - `searchDepth: 3`
- **Tests**: `worker/rust_ai_core/tests/` - Various test configurations

## Performance Metrics

### Timing Benchmarks

| Operation       | Depth 2 | Depth 3 | Depth 4 |
| --------------- | ------- | ------- | ------- |
| Single Move     | 119μs   | 2.4ms   | 34ms    |
| Full Game       | 0.6ms   | 11.4ms  | 308.8ms |
| Nodes Evaluated | 7       | 189     | 2,960   |

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

1. **Use Depth 3** for optimal balance
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

### Configuration

- `worker/src/lib.rs` - Server-side depth setting
- `src/lib/game-store.ts` - Client-side depth setting
- `worker/rust_ai_core/src/wasm_api.rs` - WASM depth validation
