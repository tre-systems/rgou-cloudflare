# TODO

## High Priority

- [x] Improve ML AI performance vs Classic AI
- [x] Fix ML AI value network always returning 0.000 (was ReLU activation on final layer)
- [x] Update Classic AI to use depth 4 to match ML training opponent
- [ ] Investigate ONNX and 'trace' for ML AI
- [ ] Optimize neural network architecture

## Medium Priority

- [ ] Implement GPU training acceleration with Rust
  - Consider frameworks like Burn, tch-rs, or custom CUDA/Metal implementation
  - Focus on Apple Silicon Metal backend for optimal performance
  - Maintain compatibility with existing CPU training pipeline
- [ ] Add self-play reinforcement learning
- [ ] Implement Monte Carlo Tree Search on top of neural network
- [ ] Optimize feature engineering (review 150 features)

## Low Priority

- [ ] Add multiplayer support
- [ ] Create mobile app version
