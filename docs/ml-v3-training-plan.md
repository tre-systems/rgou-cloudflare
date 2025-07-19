# ML-v3 Training Plan

## Overview

ML-v3 is designed to be a significantly improved version of our neural network AI through extended training with better parameters and more comprehensive evaluation.

## Key Improvements for ML-v3

### 1. Extended Training Parameters

- **Games**: 5000 (5x more than default, 167x more than ML-v2)
- **Epochs**: 300 (3x more than default, 20x more than ML-v2)
- **Learning Rate**: 0.0005 (50% lower for stability)
- **Validation Split**: 0.15 (15% for validation, 85% for training)

### 2. Training Strategy

- **Use Rust AI**: Generate high-quality training data using the Classic AI
- **Early Stopping**: Prevent overfitting with patience of 20 epochs
- **Learning Rate Scheduling**: Reduce learning rate when validation loss plateaus
- **Weight Decay**: Use AdamW optimizer with weight decay for regularization

### 3. Model Architecture

- **Value Network**: 150 → 256 → 128 → 64 → 32 → 1
- **Policy Network**: 150 → 256 → 128 → 64 → 32 → 7
- **Regularization**: Batch normalization and dropout (20%)
- **Activation**: ReLU with tanh output for value network

## Training Process

### Phase 1: Data Generation

```bash
# Generate 5000 games using Rust AI
python ml/scripts/train_ml_ai.py \
    --num-games 5000 \
    --epochs 300 \
    --learning-rate 0.0005 \
    --use-rust-ai \
    --output ml/data/weights/ml_ai_weights_v3.json \
    --validation-split 0.15
```

### Phase 2: Training

- Monitor training progress every 10 epochs
- Early stopping if validation loss doesn't improve for 20 epochs
- Learning rate reduction when validation loss plateaus

### Phase 3: Evaluation

```bash
# Test against expectiminimax AI
cd worker/rust_ai_core
cargo test test_ml_v3_vs_expectiminimax_ai -- --nocapture
cd ../..

# Full evaluation
npm run evaluate:ml -- --model ml/data/weights/ml_ai_weights_v3.json --num-games 100
```

## Expected Performance Targets

### Win Rate Targets

- **Minimum**: >45% against expectiminimax AI
- **Target**: >50% against expectiminimax AI
- **Excellent**: >55% against expectiminimax AI

### Speed Targets

- **ML-v3**: <1ms per move
- **Expectiminimax**: >10ms per move
- **Speedup**: >10x faster than expectiminimax

## Success Criteria

### Primary Metrics

1. **Win Rate**: ML-v3 should win >50% of games against expectiminimax AI
2. **Speed**: ML-v3 should be >10x faster than expectiminimax AI
3. **Consistency**: Performance should be stable across different game scenarios

### Secondary Metrics

1. **Training Convergence**: Loss should decrease steadily and converge
2. **Validation Performance**: Validation loss should track training loss
3. **Game Length**: Average game length should be reasonable (100-150 moves)

## Training Commands

### Quick Start

```bash
npm run train:ml:v3
```

### Manual Training

```bash
# Build Rust AI first
cd worker/rust_ai_core && cargo build --release && cd ../..

# Run training
python ml/scripts/train_ml_ai.py \
    --num-games 5000 \
    --epochs 300 \
    --learning-rate 0.0005 \
    --use-rust-ai \
    --output ml/data/weights/ml_ai_weights_v3.json \
    --validation-split 0.15
```

### Evaluation

```bash
# Test against expectiminimax
cd worker/rust_ai_core
cargo test test_ml_v3_vs_expectiminimax_ai -- --nocapture
cd ../..

# Load weights into app
npm run load:ml-weights ml/data/weights/ml_ai_weights_v3.json

# Run full evaluation
npm run evaluate:ml -- --model ml/data/weights/ml_ai_weights_v3.json --num-games 100
```

## Monitoring Training

### Check Training Status

```bash
bash ml/scripts/check_training_status.sh
```

### Monitor Progress

- Training progress is printed every 10 epochs
- Validation loss is monitored for early stopping
- Learning rate is automatically reduced when needed

### Expected Training Time

- **Data Generation**: ~30-60 minutes (5000 games)
- **Training**: ~2-4 hours (300 epochs)
- **Total**: ~3-5 hours

## Troubleshooting

### Common Issues

1. **Out of Memory**: Reduce batch size or number of workers
2. **Slow Training**: Check if using GPU/MPS acceleration
3. **Poor Performance**: Increase number of games or epochs
4. **Overfitting**: Increase dropout or reduce model complexity

### Performance Optimization

1. **Use GPU/MPS**: Training will be much faster on GPU
2. **Parallel Workers**: Adjust number of workers based on CPU cores
3. **Batch Size**: Optimize batch size for your hardware

## Next Steps After Training

### If ML-v3 Performs Well (>50% win rate)

1. Load weights into production app
2. Replace previous ML versions
3. Add to main test matrix
4. Consider self-play training for further improvement

### If ML-v3 Needs Improvement (<50% win rate)

1. Increase number of games (try 10000)
2. Increase number of epochs (try 500)
3. Experiment with different learning rates
4. Try different network architectures
5. Implement self-play training

## Files

- **Training Script**: `ml/scripts/train_ml_ai_v3.sh`
- **Main Training**: `ml/scripts/train_ml_ai.py`
- **Test Function**: `worker/rust_ai_core/tests/ml_vs_expectiminimax.rs::test_ml_v3_vs_expectiminimax_ai`
- **Weights Output**: `ml/data/weights/ml_ai_weights_v3.json`
- **NPM Script**: `npm run train:ml:v3`

## Conclusion

ML-v3 represents a significant step up in training scale and should produce a much stronger AI. The extended training with 5000 games and 300 epochs, combined with the improved training infrastructure, should result in an AI that significantly outperforms previous versions and competes strongly against the expectiminimax AI.
