# Current TODOs

_Active tasks and improvements for the Royal Game of Ur project._

## Critical Issues

### 1. Training Loss Function Issue

**Status**: 🟡 Important  
**Impact**: Policy network may not be learning effectively

**Problem**:

- Policy network applies softmax in definition AND uses CrossEntropyLoss
- This can cause incorrect training signals

**Solution**:

- [ ] Remove final softmax from `PolicyNetwork` definition
- [ ] Use raw logits with CrossEntropyLoss
- [ ] Verify training convergence improves
- [ ] Retrain model with corrected loss function

**Files**: `ml/scripts/train_ml_ai.py`

## Performance Improvements

### 2. Enhanced Training Data Generation

**Status**: 🟡 Performance  
**Impact**: Faster training data generation, better scalability

**Problem**:

- Per-move subprocess calls create significant overhead
- Thousands of subprocess launches during data generation

**Solution**:

- [ ] Add `simulate_complete_game()` function in Rust
- [ ] Return entire game trajectory in one call
- [ ] Modify Python script to call once per game
- [ ] Reduce inter-process communication overhead

**Files**: `worker/rust_ai_core/src/lib.rs`, `ml/scripts/train_ml_ai.py`

### 3. Better Value Targets

**Status**: 🟡 Quality  
**Impact**: More informative training signal

**Problem**:

- Current value target (piece count difference) is crude
- Doesn't capture strategic nuances

**Solution**:

- [ ] Use Classic AI's evaluation function as value targets
- [ ] Scale Classic AI scores appropriately
- [ ] Train value network to mimic Classic AI evaluation
- [ ] Retrain model with better targets

**Files**: `ml/scripts/train_ml_ai.py`

## Code Quality & Documentation

### 4. Add Reproducibility Controls

**Status**: 🟢 Maintainability  
**Impact**: Consistent results across training runs

**Solution**:

- [ ] Add random seed control via command line arguments
- [ ] Set seeds for `random`, `numpy`, and `torch`
- [ ] Save training metadata (hyperparameters, loss curves)
- [ ] Document environment requirements

**Files**: `ml/scripts/train_ml_ai.py`

### 5. Continuous Evaluation Script

**Status**: 🟢 Testing  
**Impact**: Track AI performance improvements

**Solution**:

- [ ] Create automated testing script
- [ ] Pit ML AI against Classic AI for 100+ games
- [ ] Report win rates and move quality metrics
- [ ] Integrate into development workflow

**Files**: Create new evaluation scripts

### 6. Refactor Training Script

**Status**: 🟢 Maintainability  
**Impact**: Better code organization and testability

**Problem**:

- Monolithic 800-line script is hard to maintain

**Solution**:

- [ ] Split into modules: `features.py`, `model.py`, `training.py`
- [ ] Separate data generation, model definition, training logic
- [ ] Improve code organization
- [ ] Add unit tests for individual components

**Files**: `ml/scripts/train_ml_ai.py` → multiple smaller files

## Testing & Validation

### 7. Add Integration Tests

**Status**: 🟢 Testing  
**Impact**: Ensure AI components work correctly together

**Solution**:

- [ ] Test WASM weight loading and persistence
- [ ] Test ML AI move selection consistency
- [ ] Test Classic AI vs ML AI performance
- [ ] Add automated regression tests

**Files**: Create new test files

### 8. Performance Benchmarking

**Status**: 🟢 Performance  
**Impact**: Ensure AI meets performance requirements

**Solution**:

- [ ] Measure move selection time (target: <10ms)
- [ ] Benchmark memory usage
- [ ] Test with different game states
- [ ] Document performance characteristics

**Files**: Create benchmarking scripts

## Implementation Priority

### Immediate (This Week)

1. Add reproducibility controls
2. Create continuous evaluation script

### Short-term (Next 2 Weeks)

3. Enhanced training data generation
4. Refactor training script
5. Add integration tests

### Medium-term (Next Month)

6. Better value targets (requires retraining)
7. Performance benchmarking
8. Training loss function fix (requires retraining)

## Success Criteria

- [ ] Training produces reproducible results
- [ ] Performance meets targets (<10ms move selection)
- [ ] Code is maintainable and well-tested
- [ ] Documentation is accurate and complete
- [ ] ML AI consistently uses trained weights

## Notes

- Items marked with "requires retraining" are noted but not included in immediate todos
- Focus on critical bugs first, then performance, then maintainability
- Each improvement should be tested against the Classic AI to measure impact
- Consider the trade-off between complexity and performance gains
