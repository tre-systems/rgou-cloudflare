# TODO

## AI quality

- [ ] Improve ML AI performance versus Classic AI with measured promotion thresholds
- [ ] Expand generated rule-conformance positions beyond the curated shared fixtures
- [ ] Benchmark a compact binary model artifact against gzip JSON before changing the runtime format
- [ ] Optimize the neural network architecture only when AI-matrix measurements justify a change

## Training

- [ ] Implement GPU training acceleration with Rust
  - Consider frameworks like Burn, tch-rs, or custom CUDA/Metal implementation
  - Focus on Apple Silicon Metal backend for optimal performance
  - Maintain compatibility with existing CPU training pipeline
- [ ] Add self-play reinforcement learning
- [ ] Benchmark whether neural-guided search would materially improve play before considering MCTS
- [ ] Optimize feature engineering (review 150 features)

ONNX Runtime, WebGPU inference, and a larger search framework are intentionally deferred. Reconsider them only with a benchmark that shows the existing Rust/WASM implementation is the limiting factor.

## Engineering

- [ ] Split the largest Rust modules by rules, search/cache, inference/features, WASM bindings, and training responsibilities
- [ ] Add automated WCAG scanning beyond the semantic Chromium/WebKit smoke coverage

## Low Priority

- [ ] Add multiplayer support
- [ ] Create mobile app version
