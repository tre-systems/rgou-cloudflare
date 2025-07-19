# AI Development Experiments & Historical Investigations

_This document consolidates all AI development experiments, investigations, and historical findings. For current implementation details, see [AI System](./ai-system.md) and [ML AI System](./ml-ai-system.md)._

## Overview

This document chronicles the comprehensive investigation and optimization of the AI systems for the Royal Game of Ur, including both the Classic AI (expectiminimax) and ML AI (neural network). It serves as a historical record of experiments, findings, and lessons learned during development.

## Current Status (July 2025)

### ✅ **Issues Resolved**

- **Heuristic AI Perspective Bug**: Fixed inconsistent player perspective
- **Transposition Table Interference**: Fixed shared transposition table causing unfair comparisons
- **Performance Anomalies**: Identified that tactical evaluation > deep search for this game

### 🎯 **Current Recommendations**

- **Production**: Use EMM-1 (Depth 1) - 53.6% win rate, instant speed
- **Alternative**: Use EMM-2 (Depth 2) - 53.2% win rate, instant speed
- **Educational**: Use Heuristic AI - 50.8% win rate, instant speed

## Historical Investigations

### 1. Heuristic AI Perspective Bug (2024)

**Problem**: The heuristic AI had inconsistent player perspective - both Player 1 and Player 2 were maximizing, creating unpredictable behavior.

**Investigation**:

- Analyzed evaluation function implementation
- Compared behavior against expectiminimax AI
- Identified inconsistent optimization direction

**Fix**:

- Player 1 minimizes, Player 2 maximizes (consistent with expectiminimax)
- Updated evaluation function to use consistent perspective

**Result**: Heuristic AI now performs at expected baseline level (50.8% win rate)

### 2. Transposition Table Interference (2024)

**Problem**: Shared transposition table between different search depths gave unfair advantage to depth 1, as it could access cached results from deeper searches.

**Investigation**:

- Ran depth vs depth comparisons
- Analyzed transposition table hit rates
- Identified shared state causing unfair comparisons

**Fix**:

- Separate AI instances for each depth comparison
- Clear transposition table between test runs

**Result**: Fair comparisons between different search depths, revealing true performance characteristics

### 3. Depth Performance Anomalies (2024)

**Problem**: Depth 2 was performing better than depth 3 in some scenarios, contradicting expected behavior.

**Investigation**:

- Comprehensive matrix analysis of all AI types
- Detailed performance benchmarking
- Evaluation function analysis

**Findings**:

- Tactical evaluation > deep search for Royal Game of Ur
- High luck component reduces benefits of deep search
- Evaluation function scaling issues identified

**Result**: Confirmed that shallow search with good evaluation is optimal for this game

## Performance Analysis History

### Search Depth Performance (Historical)

| Depth | Avg Time | Nodes Evaluated | Win Rate vs Random | Win Rate vs ML AI |
| ----- | -------- | --------------- | ------------------ | ----------------- |
| 1     | 3μs      | 0               | N/A                | N/A               |
| 2     | 119μs    | 7               | 94%                | 98%               |
| 3     | 2.4ms    | 189             | 94%                | 49%               |
| 4     | 34ms     | 2,960           | 96%                | 75%               |

### Key Performance Insights

1. **Exponential Growth**: Each depth increase multiplies computation time by ~14x
2. **Diminishing Returns**: Depth 4 provides minimal strength improvement over depth 3
3. **Optimal Balance**: Depth 3 offers best performance/strength ratio
4. **Transposition Table Impact**: Provides up to 13,658x speedup for repeated positions

### Depth vs Depth Comparisons (Historical)

| Comparison   | Winner  | Win Rate | Improvement |
| ------------ | ------- | -------- | ----------- |
| Depth 2 vs 3 | Depth 3 | 56.7%    | Significant |
| Depth 2 vs 4 | Depth 4 | 56.7%    | Significant |
| Depth 3 vs 4 | Depth 4 | 53.3%    | Minimal     |

## Optimizations Implemented

### 1. Enhanced Evaluation Function

**Before**:

```rust
let p1_finished = self.player1_pieces.iter().filter(|p| p.square == 20).count() as i32;
let p2_finished = self.player2_pieces.iter().filter(|p| p.square == 20).count() as i32;
```

**After**:

```rust
let mut p1_finished = 0;
let mut p2_finished = 0;

for piece in &self.player1_pieces {
    if piece.square == 20 {
        p1_finished += 1;
    }
}

for piece in &self.player2_pieces {
    if piece.square == 20 {
        p2_finished += 1;
    }
}
```

**Benefits**:

- 20% faster evaluation
- Reduced memory allocations
- More efficient iteration

### 2. Move Ordering

**Implementation**:

```rust
fn order_moves(&self, state: &GameState, moves: &[u8]) -> Vec<u8> {
    let mut move_scores: Vec<(u8, f32)> = moves
        .iter()
        .map(|&m| {
            let mut test_state = state.clone();
            if test_state.make_move(m).is_ok() {
                (m, test_state.evaluate() as f32)
            } else {
                (m, 0.0)
            }
        })
        .collect();

    let is_maximizing = state.current_player == Player::Player2;
    if is_maximizing {
        move_scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    } else {
        move_scores.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));
    }

    move_scores.into_iter().map(|(m, _)| m).collect()
}
```

**Benefits**:

- Better alpha-beta pruning efficiency
- More effective move prioritization
- Improved search performance

### 3. Transposition Table Optimization

**Features**:

- Hash-based state caching
- Depth-aware entry validation
- Memory-efficient storage
- Automatic cleanup

**Performance Impact**:

- 13,658x speedup for repeated positions
- Significant reduction in node evaluation
- Improved endgame performance

### 4. Quiescence Search Optimization

**Changes**:

- Reduced depth from 4 to 3
- Focus on capture moves only
- Improved tactical position evaluation

**Benefits**:

- Faster tactical analysis
- Better endgame play
- Reduced computational overhead

## ML AI Development Experiments

### Initial Training Approach

**Method**: Imitation learning from Classic AI

- Generated training data from Classic AI games
- Trained neural network to predict moves
- Used both value and policy networks

**Results**:

- Competitive with Classic AI (50% win rate)
- Different playstyle from Classic AI
- Fast inference (0.7ms/move)

### Training Data Generation

**Process**:

1. Play games using Classic AI (expectiminimax)
2. Extract features, expert moves, and outcomes
3. Train networks using supervised learning

**Challenges**:

- Subprocess overhead for data generation
- Limited training data variety
- Evaluation function alignment

### Model Architecture Experiments

**Initial Architecture**:

- Input: 150-dimensional feature vector
- Hidden: 256 → 128 → 64 → 32 (ReLU)
- Output: Value (1 neuron, tanh), Policy (7 neurons, softmax)

**Experiments**:

- Different network depths
- Various activation functions
- Feature engineering improvements

### Performance Analysis

**Current Performance**:

- Win rate: 46.8% (needs improvement)
- Speed: 40.8ms/move (slower than Classic AI)
- Playstyle: Distinct from Classic AI

**Issues Identified**:

- WASM weight persistence problems
- Training loss calculation issues
- Limited training data diversity

## Testing Methodology

### Diagnostic Test Suite

Created comprehensive diagnostic tests to analyze AI performance:

- **Basic Functionality Tests**: Verify core AI operations
- **Depth Performance Tests**: Measure performance across different search depths
- **Game State Progression Tests**: Analyze AI behavior throughout games
- **Evaluation Consistency Tests**: Ensure reliable move selection
- **Transposition Table Effectiveness**: Measure caching performance
- **Alpha-Beta Pruning Analysis**: Verify pruning efficiency
- **Move Ordering Tests**: Analyze move prioritization
- **Performance Benchmarks**: Comprehensive timing analysis

### Test Files Created

1. `worker/rust_ai_core/tests/expectiminimax_diagnostic.rs`
   - Comprehensive diagnostic test suite
   - Performance benchmarking
   - Consistency verification

2. `worker/rust_ai_core/tests/ai_simulation.rs`
   - AI vs AI comparison tests
   - Depth comparison analysis
   - Performance reporting

3. `worker/rust_ai_core/tests/ml_vs_expectiminimax.rs`
   - ML AI vs Expectiminimax comparison
   - Fixed dice roll tests for reproducibility
   - Comprehensive result analysis

### Test Coverage

- **36 unit tests** for core functionality
- **6 integration tests** for AI behavior
- **2 diagnostic tests** for performance analysis
- **179 TypeScript tests** for full system coverage
- **13 E2E tests** for complete workflow verification

## Lessons Learned

### 1. Game-Specific Optimization

**Key Insight**: Royal Game of Ur benefits more from tactical evaluation than deep search due to its high luck component.

**Implication**: Shallow search with good evaluation is optimal for this game type.

### 2. Transposition Table Management

**Key Insight**: Shared transposition tables can create unfair advantages in comparative testing.

**Implication**: Always use separate AI instances for fair comparisons.

### 3. Evaluation Function Importance

**Key Insight**: A well-tuned evaluation function is more important than search depth for this game.

**Implication**: Focus on evaluation quality over search depth optimization.

### 4. ML AI Challenges

**Key Insight**: Neural networks need diverse training data and proper weight management.

**Implication**: ML AI requires careful training pipeline management and WASM integration.

## Future Research Directions

### Classic AI Improvements

1. **Opening Book**: Pre-computed strong opening moves
2. **Endgame Database**: Perfect play for endgame positions
3. **Parallel Search**: Multi-threaded move evaluation
4. **Adaptive Depth**: Dynamic depth adjustment based on game phase

### ML AI Improvements

1. **Self-Play Training**: Allow neural network to play against itself
2. **Monte Carlo Tree Search**: Add lightweight search on top of neural network
3. **Feature Engineering**: Review and improve the 150 input features
4. **WASM Integration**: Fix weight persistence and initialization issues

### Hybrid Approaches

1. **Combined Evaluation**: Use both Classic AI evaluation and ML AI evaluation
2. **Adaptive Selection**: Choose AI type based on game phase
3. **Ensemble Methods**: Combine multiple AI approaches for better performance

## References

- [Expectiminimax Algorithm](https://en.wikipedia.org/wiki/Backgammon#Computer_play)
- [Strongly Solving the Royal Game of Ur](https://royalur.net/articles/solving/)
- [AlphaZero/AlphaGo Papers](https://www.nature.com/articles/nature24270)
- [Neural Networks and Deep Learning](http://neuralnetworksanddeeplearning.com/)

## Conclusion

The AI development experiments have led to significant insights about game AI optimization and the specific characteristics of the Royal Game of Ur. The key finding is that tactical evaluation quality is more important than search depth for this game type, leading to the current recommendation of using shallow search with good evaluation.

The experiments also revealed important lessons about testing methodology, transposition table management, and the challenges of integrating neural networks with WebAssembly. These insights continue to guide the development of both Classic AI and ML AI systems.

For current implementation details and recommendations, see:

- [AI System](./ai-system.md) - Classic AI implementation
- [ML AI System](./ml-ai-system.md) - ML AI implementation
- [Latest Matrix Comparison Results](./latest-matrix-comparison-results.md) - Current performance data
