# AI Improvement Roadmap

This document outlines a comprehensive plan for improving the neural network AI based on technical analysis and modern best practices.

## Overview

The current ML AI achieves approximately 50% win rate against the Classic AI (Expectiminimax algorithm), providing a solid foundation for further development. This roadmap prioritizes improvements that will have the greatest impact on performance and maintainability.

## ✅ Completed Improvements

### 1. WASM Weight Persistence Bug ✅

**Status**: Fixed
**Impact**: High - This was causing the AI to use random weights instead of trained ones.

**Solution**:

- Maintained a global singleton `MLAI` instance in Rust
- Load weights once and reuse the instance for all move queries
- Ensured the TypeScript worker's expectation of persistence aligns with Rust implementation

**Files modified**: `worker/rust_ai_core/src/ml_ai.rs`, `src/lib/ml-ai.worker.ts`

### 2. Training Loss Function Issue ✅

**Status**: Fixed
**Impact**: Medium - Was limiting the policy network's learning effectiveness.

**Solution**:

- Removed final softmax from network definition
- Used raw logits with CrossEntropyLoss (which internally applies log-softmax)
- Verified training convergence improves

**Files modified**: `ml/scripts/train_ml_ai.py`

### 3. Enhanced Training Infrastructure ✅

**Status**: Implemented
**Improvements**:

- Added batch normalization and dropout for better regularization
- Implemented learning rate scheduling with ReduceLROnPlateau
- Added early stopping to prevent overfitting
- Enhanced value targets using Classic AI's evaluation function
- Added reproducibility controls with random seed management
- Implemented validation split for better training monitoring
- Switched to AdamW optimizer with weight decay
- Added comprehensive training metadata and model versioning

**Files modified**: `ml/scripts/train_ml_ai.py`

### 4. Advanced Training Scripts ✅

**Status**: Created
**New Capabilities**:

- Self-play training framework (`train_ml_ai_advanced.py`)
- Comprehensive evaluation system (`evaluate_ml_ai.py`)
- Enhanced training commands in package.json

**Files created**:

- `ml/scripts/train_ml_ai_advanced.py`
- `ml/scripts/evaluate_ml_ai.py`

## 🚧 In Progress Improvements

### 5. Enhanced Training Data Generation

**Status**: 🟡 Performance
**Impact**: Faster training data generation, better scalability

**Problem**:

- Per-move subprocess calls create significant overhead
- Thousands of subprocess launches during data generation

**Solution**:

- Add `simulate_complete_game()` function in Rust
- Return entire game trajectory in one call
- Modify Python script to call once per game
- Reduce inter-process communication overhead

**Files to modify**: `worker/rust_ai_core/src/lib.rs`, `ml/scripts/train_ml_ai.py`

## 🔮 Future Research Directions

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

### 9. Refactor Training Script ✅

**Status**: Partially completed
**Problem**: Monolithic 800-line script is hard to maintain.

**Solution**:

- ✅ Enhanced existing script with better organization
- [ ] Split into modules: `features.py`, `model.py`, `training.py`
- [ ] Separate data generation, model definition, and training logic
- [ ] Improve code organization and testability

**Files to modify**: `ml/scripts/train_ml_ai.py` → multiple smaller files

### 10. Add Reproducibility ✅

**Status**: Implemented
**Goal**: Ensure consistent results across training runs.

**Solution**:

- ✅ Added random seed control via command line arguments
- ✅ Set seeds for `random`, `numpy`, and `torch`
- ✅ Save training metadata (hyperparameters, loss curves, performance metrics)
- ✅ Document environment requirements

**Files modified**: `ml/scripts/train_ml_ai.py`

### 11. Continuous Evaluation ✅

**Status**: Implemented
**Goal**: Track AI performance improvements over time.

**Solution**:

- ✅ Created automated testing script
- ✅ Pit ML AI against Classic AI for 100+ games
- ✅ Report win rates and move quality metrics
- ✅ Integrate into development workflow

**Files created**: `ml/scripts/evaluate_ml_ai.py`

## Implementation Priority

### Phase 1 (Immediate - Critical Fixes) ✅

1. ✅ Fix WASM weight persistence bug
2. ✅ Correct training loss function
3. ✅ Add basic reproducibility controls

### Phase 2 (Short-term - Performance) 🚧

4. 🚧 Enhanced training data generation
5. ✅ Better value targets
6. [ ] Feature engineering review

### Phase 3 (Medium-term - Architecture) ✅

7. ✅ Enhanced network architecture with regularization
8. ✅ Improved training infrastructure
9. ✅ Continuous evaluation

### Phase 4 (Long-term - Research)

10. [ ] Self-play reinforcement learning
11. [ ] Monte Carlo Tree Search
12. [ ] Advanced architectures (attention, etc.)

## Success Metrics

- **Performance**: Win rate against Classic AI (target: >60%)
- **Speed**: Move selection time (target: <10ms)
- **Code Quality**: Test coverage, maintainability scores
- **Reproducibility**: Consistent results across training runs

## How to Train a Better Model

### Quick Start (Enhanced Training)

```bash
# Build Rust AI first
npm run build:rust-ai

# Train with enhanced settings
npm run train:ml:enhanced

# Evaluate the model
npm run evaluate:ml
```

### Advanced Training (Self-Play)

```bash
# Train with self-play (requires initial model)
npm run train:ml:selfplay

# Evaluate against Classic AI
npm run evaluate:ml -- --model ml/data/weights/ml_ai_weights_v3_iter_5.json
```

### Manual Training

```bash
# Basic training
python ml/scripts/train_ml_ai.py --use-rust-ai --num-games 1000 --epochs 200

# With custom parameters
python ml/scripts/train_ml_ai.py \
  --use-rust-ai \
  --num-games 2000 \
  --epochs 300 \
  --learning-rate 0.0005 \
  --batch-size 128 \
  --seed 42
```

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
- The enhanced training infrastructure should provide significant improvements in model quality
