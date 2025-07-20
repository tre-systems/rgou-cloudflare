# AI Development History & Experiments

_This document consolidates all historical AI development experiments, investigations, and findings. For current implementation details, see [AI System](./ai-system.md) and [ML AI System](./ml-ai-system.md)._

## Overview

This document chronicles the comprehensive investigation and optimization of the AI systems for the Royal Game of Ur, including both the Classic AI (expectiminimax) and ML AI (neural network). It serves as a historical record of experiments, findings, and lessons learned during development.

## Current Status (July 2025)

### ✅ **Issues Resolved**

- **Heuristic AI Perspective Bug**: Fixed inconsistent player perspective
- **Transposition Table Interference**: Fixed shared transposition table causing unfair comparisons
- **Performance Anomalies**: Identified that tactical evaluation > deep search for this game
- **ML AI v2 Training**: Successfully trained v2 model with multiprocessing and improved architecture

### 🎯 **Current Recommendations**

- **Production**: Use EMM-1 (Depth 1) - 53.6% win rate, instant speed
- **Alternative**: Use EMM-2 (Depth 2) - 53.2% win rate, instant speed
- **Educational**: Use Heuristic AI - 50.8% win rate, instant speed
- **ML AI**: Use ML-v2 - 50% win rate vs EMM, competitive performance

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

- Better tactical play
- Reduced computation time
- More stable evaluation

## ML AI Development History

### ML AI v1 (Initial Model)

**Architecture**:

- Input: 100 features
- Hidden layers: [128, 64, 32]
- Output: Value (1 neuron), Policy (7 neurons)

**Training**:

- 100 games, 50 epochs
- Learning rate: 0.001
- Basic training pipeline

**Performance**:

- ~20% win rate vs Expectiminimax
- <1ms per move
- Basic functionality achieved

### ML AI v2 (Enhanced Model)

**Architecture**:

- Input: 150 features
- Hidden layers: [256, 128, 64, 32]
- Batch normalization and dropout
- Enhanced feature engineering

**Training**:

- 1,000 games, 100 epochs
- Learning rate scheduling
- Multiprocessing support
- GPU acceleration (MPS/CUDA)

**Performance**:

- ~50% win rate vs Expectiminimax
- <1ms per move
- Competitive with Classic AI

### ML AI v3 (Extended Training)

**Architecture**:

- Same as v2
- Extended training parameters

**Training**:

- 5,000 games, 300 epochs
- Lower learning rate: 0.0005
- Enhanced validation

**Performance**:

- Improved consistency
- Better generalization
- More stable play

## Training System Evolution

### Early Training (v1)

**Issues**:

- Single-threaded game generation
- No GPU acceleration
- Basic progress reporting
- Limited validation

**Solutions**:

- Implemented multiprocessing
- Added GPU support
- Enhanced progress bars
- Proper train/validation split

### Current Training System

**Features**:

- Parameterized training for multiple versions
- GPU acceleration (MPS/CUDA)
- Parallel game generation
- Comprehensive progress tracking
- Weight compression and optimization
- Metadata tracking

**Benefits**:

- 3-8x faster data generation
- 10-20x faster training with GPU
- Better model quality
- Reproducible results

## Lessons Learned

### 1. Game-Specific Optimization

**Finding**: The Royal Game of Ur favors tactical evaluation over deep search due to its high luck component.

**Implication**: Shallow search with good evaluation is more effective than deep search with basic evaluation.

**Application**: Focus on evaluation function quality rather than search depth.

### 2. Performance vs Quality Trade-offs

**Finding**: Depth 3 provides the best performance/quality ratio for this game.

**Implication**: Deeper search doesn't always provide proportional benefits.

**Application**: Use depth 3 for production.

### 3. ML AI Training Insights

**Finding**: Imitation learning from strong AI provides good baseline performance.

**Implication**: Self-play or reinforcement learning could improve performance further.

**Application**: Consider hybrid training approaches for future versions.

### 4. System Architecture Benefits

**Finding**: WebAssembly provides excellent performance for game AI.

**Implication**: Browser-native AI is viable for complex games.

**Application**: Continue using WASM for all AI components.

## Future Research Directions

### 1. ML AI Improvements

- **Self-play training**: Allow ML AI to play against itself
- **Reinforcement learning**: Use game outcomes to improve policy
- **Monte Carlo Tree Search**: Add lightweight search to ML AI
- **Feature engineering**: Analyze and optimize input features

### 2. Classic AI Enhancements

- **Opening book**: Add common opening moves
- **Endgame database**: Perfect play for endgame positions
- **Evaluation tuning**: Optimize evaluation function
- **Move ordering**: Improve alpha-beta pruning efficiency

### 3. System Optimizations

- **WASM optimization**: Further optimize WebAssembly performance
- **Memory management**: Improve memory usage patterns
- **Parallel processing**: Add parallel move evaluation
- **Caching strategies**: Optimize transposition table usage

## References

- [Expectiminimax Algorithm](https://en.wikipedia.org/wiki/Backgammon#Computer_play)
- [Strongly Solving the Royal Game of Ur](https://royalur.net/solved)
- [AlphaZero Paper](https://www.nature.com/articles/nature24270)
- [Neural Networks and Deep Learning](http://neuralnetworksanddeeplearning.com/)
