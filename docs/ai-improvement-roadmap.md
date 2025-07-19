# AI Improvement Roadmap

This document outlines a comprehensive plan for improving the neural network AI based on technical analysis and modern best practices.

## Overview

The current ML AI achieves approximately 50% win rate against the Classic AI (Expectiminimax algorithm), providing a solid foundation for further development. This roadmap prioritizes improvements that will have the greatest impact on performance and maintainability.

## Critical Issues (Fix First)

### 1. WASM Weight Persistence Bug

**Problem**: The current implementation creates a new `MLAI` instance on every call, potentially causing the network to use uninitialized weights.

**Impact**: High - This could mean the AI is playing with random weights instead of trained ones.

**Solution**:

- Maintain a global singleton `MLAI` instance in Rust
- Load weights once and reuse the instance for all move queries
- Ensure the TypeScript worker's expectation of persistence aligns with Rust implementation

**Files to modify**: `worker/rust_ai_core/src/ml_ai.rs`, `src/lib/ml-ai.worker.ts`

### 2. Training Loss Function Issue

**Problem**: Policy network applies softmax in network definition AND uses CrossEntropyLoss, which may yield incorrect training signals.

**Impact**: Medium - Could be limiting the policy network's learning effectiveness.

**Solution**:

- Remove final softmax from network definition
- Use raw logits with CrossEntropyLoss (which internally applies log-softmax)
- Verify training convergence improves

**Files to modify**: `ml/scripts/train_ml_ai.py`

## Performance & Architecture Improvements

### 3. Unified Network Architecture

**Problem**: Currently two separate networks (value and policy) require two forward passes per evaluation.

**Benefit**: Halve inference cost, reduce code duplication, align with modern architectures.

**Solution**:

- Create shared trunk: 150→256→128→64→32
- Two output heads: 32→1 (value, tanh), 32→7 (policy, softmax)
- Multi-task training with combined loss function

**Difficulty**: Medium - Requires significant refactoring of both Python training and Rust inference.

### 4. Enhanced Training Data Generation

**Problem**: Per-move subprocess calls create significant overhead during data generation.

**Benefit**: Scale to more games efficiently, faster training data generation.

**Solution**:

- Add "self-play game" function in Rust that returns complete game trajectory
- Call once per game instead of per move
- Reduce inter-process communication overhead

**Files to modify**: `worker/rust_ai_core/src/lib.rs`, `ml/scripts/train_ml_ai.py`

### 5. Better Value Targets

**Problem**: Current value target (piece count difference) is a crude heuristic.

**Benefit**: More informative training signal, better value network accuracy.

**Solution**:

- Use Classic AI's evaluation function as value targets
- Scale Classic AI scores appropriately for training
- Train value network to mimic Classic AI's evaluation directly

**Files to modify**: `ml/scripts/train_ml_ai.py`

## Advanced Research Directions

### 6. Self-Play Reinforcement Learning

**Goal**: Move beyond imitation learning to discover novel strategies.

**Approach**:

1. Initial phase: Imitation learning (current)
2. Self-play phase: Network plays against itself
3. Fine-tuning: Use game outcomes to improve networks
4. Iterative improvement: Repeat self-play and training

**Expected Outcome**: Potential to exceed Classic AI performance.

**Difficulty**: High - Requires implementing reinforcement learning algorithms.

### 7. Monte Carlo Tree Search (MCTS)

**Goal**: Add search capability to catch tactics the network might miss.

**Approach**:

- Lightweight 2-ply expectiminimax using value network
- Or full MCTS with policy/value network guidance
- Balance between search depth and speed

**Expected Outcome**: Significant performance improvement, especially in tactical situations.

**Difficulty**: High - Complex implementation, requires careful tuning.

### 8. Feature Engineering Review

**Goal**: Optimize the 150-dimensional feature vector.

**Approach**:

- Analyze feature importance during training
- Remove features that don't provide signal
- Consider adding missing features (e.g., distance to rosettes)
- Ensure current player perspective is handled correctly

**Expected Outcome**: Cleaner, more effective feature representation.

**Difficulty**: Low - Mostly analysis and experimentation.

## Code Quality & Maintainability

### 9. Refactor Training Script

**Problem**: Monolithic 800-line script is hard to maintain.

**Solution**:

- Split into modules: `features.py`, `model.py`, `training.py`
- Separate data generation, model definition, and training logic
- Improve code organization and testability

**Files to modify**: `ml/scripts/train_ml_ai.py` → multiple smaller files

### 10. Add Reproducibility

**Goal**: Ensure consistent results across training runs.

**Solution**:

- Add random seed control via command line arguments
- Save training metadata (hyperparameters, loss curves, performance metrics)
- Document environment requirements

**Files to modify**: `ml/scripts/train_ml_ai.py`

### 11. Continuous Evaluation

**Goal**: Track AI performance improvements over time.

**Solution**:

- Automated testing script: ML AI vs Classic AI
- Report win rates, move quality metrics
- Integrate into development workflow

**Files to modify**: Create new evaluation scripts

## Implementation Priority

### Phase 1 (Immediate - Critical Fixes)

1. Fix WASM weight persistence bug
2. Correct training loss function
3. Add basic reproducibility controls

### Phase 2 (Short-term - Performance)

4. Enhanced training data generation
5. Better value targets
6. Feature engineering review

### Phase 3 (Medium-term - Architecture)

7. Unified network architecture
8. Refactor training script
9. Continuous evaluation

### Phase 4 (Long-term - Research)

10. Self-play reinforcement learning
11. Monte Carlo Tree Search
12. Advanced architectures (attention, etc.)

## Success Metrics

- **Performance**: Win rate against Classic AI (target: >60%)
- **Speed**: Move selection time (target: <10ms)
- **Code Quality**: Test coverage, maintainability scores
- **Reproducibility**: Consistent results across training runs

## Resources & References

- [AlphaZero Paper](https://www.nature.com/articles/nature24270) - Self-play and MCTS
- [PyTorch Multi-task Learning](https://pytorch.org/tutorials/beginner/blitz/cifar10_tutorial.html) - Unified network training
- [Monte Carlo Tree Search](https://en.wikipedia.org/wiki/Monte_Carlo_tree_search) - Search algorithms
- [Feature Engineering Best Practices](https://developers.google.com/machine-learning/guides/rules-of-ml) - Google ML guidelines

## Notes

- The current 50% win rate against Classic AI is actually quite good for imitation learning
- Focus on critical bugs first, then performance, then research directions
- Each improvement should be tested against the Classic AI to measure impact
- Consider the trade-off between complexity and performance gains
