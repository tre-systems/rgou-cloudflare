# AI Testing Strategy

This document outlines the comprehensive and coordinated strategy for testing different AI players in the Royal Game of Ur system.

## Overview

The AI testing system has been redesigned to provide a unified, cohesive approach to evaluating AI performance. The new framework addresses the previous issues of scattered tests, inconsistent patterns, and poor error handling.

## Architecture

### Core Components

1. **AI Matrix Test** (`worker/rust_ai_core/tests/ai_matrix_test.rs`)
   - Comprehensive testing infrastructure
   - Unified player interface
   - Complete matrix of all AI vs all AI comparisons
   - Automated performance analysis and recommendations

2. **Legacy Tests** (for specific scenarios)
   - `coordinated_ai_test.rs` - Basic functionality tests
   - `expectiminimax_diagnostic.rs` - Performance diagnostics
   - `genetic_params_comparison.rs` - Parameter optimization
   - `ml_vs_expectiminimax.rs` - ML vs traditional AI comparisons

3. **Frontend Tests** (`src/lib/__tests__/ai-comparison.test.ts`)
   - TypeScript-based AI service testing
   - Frontend integration validation
   - Error handling verification

4. **Test Runner Script** (`scripts/test-ai-comparison.sh`)
   - Unified test execution
   - Configurable test parameters
   - Automated result generation

## AI Player Types

### Expectiminimax Players

- **EMM-Depth1**: Fast baseline (~31% win rate)
- **EMM-Depth2**: Strong alternative (~52% win rate)
- **EMM-Depth3**: Best overall performance (~73% win rate)
- **EMM-Depth4**: Maximum depth (slow, for comprehensive testing)

### ML Players

- **ML-Fast**: Quick ML model for real-time play (~62% win rate)
- **ML-V2**: Second generation ML model (~65% win rate)
- **ML-V4**: Fourth generation ML model (~60% win rate)
- **ML-Hybrid**: Hybrid approach combining multiple strategies (~52% win rate)
- **ML-PyTorch-V5**: Latest PyTorch-based model (~63% win rate)

### Baseline Players

- **Heuristic**: Rule-based AI for educational purposes (~39% win rate)
- **Random**: Random move selection for baseline comparison (~3% win rate)

## Test Categories

### Matrix Tests (Primary)

- **Comprehensive AI Matrix**: Every AI vs every other AI
- **Performance Rankings**: Win rates, speed analysis, recommendations
- **Configurable Games**: 5-100 games per match via NUM_GAMES environment variable
- **All AI Types**: Includes Random, Heuristic, EMM (depths 1-4), and all ML models

### Fast Tests (Default)

- Basic functionality validation
- AI player trait verification
- Performance metrics calculation
- Head-to-head result validation
- TypeScript service testing

### Slow Tests (Optional)

- Depth 4 expectiminimax testing
- Comprehensive ML model evaluation
- Extended game simulations
- Memory usage analysis

## Running Tests

### Quick Test Suite

```bash
npm run test:ai-comparison:fast
```

### Comprehensive Test Suite

```bash
npm run test:ai-comparison:comprehensive
```

### Matrix Test Only

```bash
cd worker/rust_ai_core
NUM_GAMES=20 cargo test test_ai_matrix -- --nocapture
```

### Individual Test Types

```bash
# Matrix test with custom games
NUM_GAMES=50 cd worker/rust_ai_core && cargo test test_ai_matrix -- --nocapture

# Include slow tests (depth 4)
RUN_SLOW_TESTS=1 cd worker/rust_ai_core && cargo test test_ai_matrix -- --nocapture

# TypeScript tests
npm run test src/lib/__tests__/ai-comparison.test.ts
```

### Custom Configuration

```bash
# Custom number of games
NUM_GAMES=50 ./scripts/test-ai-comparison.sh

# Include slow tests
INCLUDE_SLOW_TESTS=true ./scripts/test-ai-comparison.sh

# Custom output file
OUTPUT_FILE=my_results.json ./scripts/test-ai-comparison.sh

# Reproducible results
RANDOM_SEED=12345 ./scripts/test-ai-comparison.sh
```

## Test Results

### Matrix Output Format

The AI matrix test generates comprehensive results including:

```
🤖 AI Matrix Test - Comprehensive AI Comparison
============================================================
Configuration:
  Games per match: 20
  Include slow tests: false

Testing 10 AI types:
  - Random
  - Heuristic
  - EMM-Depth1
  - EMM-Depth2
  - EMM-Depth3
  - ML-Fast
  - ML-V2
  - ML-V4
  - ML-Hybrid
  - ML-PyTorch-V5

📊 AI MATRIX RESULTS
============================================================
Test Configuration:
  Total games played: 900
  Duration: 89.26 seconds
  Games per second: 10.1

MATRIX TABLE (Win Rate % of Row vs Column):
--------------------------------------------------------------------------------
AI Type         Random     Heuristic  EMM-Depth1 EMM-Depth2 EMM-Depth3 ML-Fast    ML-V2      ML-V4      ML-Hybrid  ML-PyTorch-V5
--------------------------------------------------------------------------------
Random          -          15.0       10.0       0.0        0.0        0.0        0.0        5.0        0.0        0.0
Heuristic       85.0       -          55.0       20.0       15.0       40.0       15.0       45.0       35.0       40.0
EMM-Depth1      90.0       45.0       -          25.0       5.0        25.0       15.0       20.0       30.0       25.0
EMM-Depth2      100.0      80.0       75.0       -          30.0       35.0       35.0       35.0       45.0       35.0
EMM-Depth3      100.0      85.0       95.0       70.0       -          70.0       60.0       60.0       75.0       45.0
ML-Fast         100.0      60.0       75.0       65.0       30.0       -          60.0       45.0       75.0       45.0
ML-V2           100.0      85.0       85.0       65.0       40.0       40.0       -          45.0       65.0       60.0
ML-V4           95.0       55.0       80.0       65.0       40.0       55.0       55.0       -          60.0       35.0
ML-Hybrid       100.0      65.0       70.0       55.0       25.0       25.0       35.0       40.0       -          50.0
ML-PyTorch-V5   100.0      60.0       75.0       65.0       55.0       55.0       40.0       65.0       50.0       -
--------------------------------------------------------------------------------

🏆 PERFORMANCE SUMMARY:
----------------------------------------
1. EMM-Depth3: 73.3% average win rate
2. ML-V2: 65.0% average win rate
3. ML-PyTorch-V5: 62.8% average win rate
4. ML-Fast: 61.7% average win rate
5. ML-V4: 60.0% average win rate
6. EMM-Depth2: 52.2% average win rate
7. ML-Hybrid: 51.7% average win rate
8. Heuristic: 38.9% average win rate
9. EMM-Depth1: 31.1% average win rate
10. Random: 3.3% average win rate

⚡ SPEED ANALYSIS:
----------------------------------------
Random: 0.0ms/move (Very Fast)
Heuristic: 0.0ms/move (Very Fast)
EMM-Depth1: 0.0ms/move (Very Fast)
EMM-Depth2: 0.0ms/move (Very Fast)
EMM-Depth3: 14.9ms/move (Moderate)
ML-V4: 49.7ms/move (Moderate)
ML-V2: 50.3ms/move (Slow)
ML-Hybrid: 51.2ms/move (Slow)
ML-PyTorch-V5: 55.6ms/move (Slow)
ML-Fast: 58.2ms/move (Slow)

💡 RECOMMENDATIONS:
----------------------------------------
• Best performing AI: EMM-Depth3 (ready for production)
• Fastest AI: Random (suitable for real-time play)
• Use EMM-Depth3 for best performance/speed balance
• Use Random AI for baseline testing
• Use Heuristic AI for educational purposes
```

### Performance Metrics

#### Win Rate Rankings (Latest Results)

1. **EMM-Depth3**: 73.3% (Best overall performance)
2. **ML-V2**: 65.0% (Strong ML model)
3. **ML-PyTorch-V5**: 62.8% (Latest PyTorch model)
4. **ML-Fast**: 61.7% (Fast ML model)
5. **ML-V4**: 60.0% (Fourth generation ML)
6. **EMM-Depth2**: 52.2% (Good balance)
7. **ML-Hybrid**: 51.7% (Hybrid approach)
8. **Heuristic**: 38.9% (Educational baseline)
9. **EMM-Depth1**: 31.1% (Fast baseline)
10. **Random**: 3.3% (Baseline comparison)

#### Speed Categories

- **Very Fast**: <1ms/move (Random, Heuristic, EMM-Depth1, EMM-Depth2)
- **Moderate**: 10-50ms/move (EMM-Depth3, ML-V4)
- **Slow**: >50ms/move (ML-V2, ML-Hybrid, ML-PyTorch-V5, ML-Fast)

## Integration with CI/CD

### GitHub Actions

The test suite integrates with the existing CI/CD pipeline:

```yaml
- name: Run AI Tests
  run: |
    npm run test:ai-comparison:fast
    # Matrix test runs automatically as part of the suite
```

### Test Configuration

- **Default**: 10 games per match (fast feedback)
- **Comprehensive**: 100 games per match (thorough analysis)
- **Custom**: Configurable via NUM_GAMES environment variable

## Key Findings

### Performance Insights

1. **EMM-Depth3** is the best performing AI overall with 73.3% win rate
2. **ML-V2** shows the strongest ML performance at 65.0% win rate
3. **ML-PyTorch-V5** demonstrates competitive performance at 62.8% win rate
4. **EMM-Depth2** provides a good balance of speed and performance
5. **Random AI** serves as an effective baseline at 3.3% win rate

### Speed Analysis

1. **Traditional AIs** (Random, Heuristic, EMM-Depth1/2) are very fast
2. **EMM-Depth3** provides moderate speed with excellent performance
3. **ML models** are slower but competitive in performance
4. **ML-V4** offers the best speed among ML models

### Recommendations

1. **Production Use**: EMM-Depth3 for best overall performance
2. **Real-time Play**: EMM-Depth2 for good balance of speed and strength
3. **Educational**: Heuristic AI for understanding game strategy
4. **Baseline Testing**: Random AI for performance comparisons
5. **ML Research**: ML-V2 and ML-PyTorch-V5 for advanced AI development

## Maintenance

### Adding New AI Types

1. Add new AI type to `AIType` enum in `ai_matrix_test.rs`
2. Implement `AIPlayer` trait for the new AI
3. Add weights file path if it's an ML model
4. Update test configuration to include the new AI

### Test Data Management

- Use seeded random number generators for consistency
- Store weight files in `ml/data/weights/` directory
- Maintain test results in structured format
- Update documentation with new findings

### Performance Monitoring

- Track win rates over time
- Monitor speed changes with updates
- Compare against baseline AIs
- Generate performance reports

## Troubleshooting

### Common Issues

- **Missing Weight Files**: Ensure ML weight files exist in correct paths
- **Slow Tests**: Use NUM_GAMES=5 for quick testing
- **Memory Issues**: Clear transposition tables between tests
- **Inconsistent Results**: Check random seeding configuration

### Debug Mode

```bash
RUST_LOG=debug cargo test test_ai_matrix -- --nocapture
```

## Future Enhancements

1. **Automated Performance Tracking**: Store results over time
2. **Visualization**: Generate charts and graphs from matrix data
3. **Regression Testing**: Detect performance changes automatically
4. **Parallel Testing**: Run multiple AI comparisons simultaneously
5. **Cloud Testing**: Run comprehensive tests on cloud infrastructure
