# TODO

_Consolidated task list for the Royal Game of Ur project._

## 🚀 This Week (High Priority)

### Code Quality

- [ ] **Reduce production logging noise** - Add environment-based controls in AI services
- [ ] **Remove commented code** - Clean up heuristic AI placeholder and other commented sections

### Documentation

- [ ] **Add visual architecture diagram** - Show client-side vs server-side components
- [ ] **Document Cloudflare Worker infrastructure** - Explain preserved server-side capabilities

## 📅 Next 2 Weeks (Medium Priority)

### Security & Infrastructure

- [ ] **Enable GitHub Dependabot alerts** - Proactive vulnerability detection
- [ ] **Add CodeQL analysis** - Automated security scanning
- [ ] **Optimize build process** - Review WASM build and CI/CD pipeline

### ML Training

- [ ] **Add reproducibility controls** - Random seed control and metadata saving
- [ ] **Create continuous evaluation script** - Automated AI performance testing

## 🔄 Ongoing (Lower Priority)

### ML Improvements

- [ ] **Fix training loss function** - Remove softmax from PolicyNetwork definition
- [ ] **Enhanced training data generation** - Add `simulate_complete_game()` in Rust
- [ ] **Better value targets** - Use Classic AI evaluation function
- [ ] **Refactor training script** - Split into modules for maintainability

### Testing & Performance

- [ ] **Add integration tests** - Test WASM weight loading and AI consistency
- [ ] **Performance benchmarking** - Measure move selection time and memory usage
- [ ] **Enhanced developer documentation** - Deployment guides and troubleshooting

## ✅ Recently Completed

- [x] Update README with WASM architecture evolution
- [x] Update architecture overview with detailed evolution explanation
- [x] Create comprehensive Cloudflare Worker infrastructure documentation
- [x] Consolidate TODO lists into single file

## 📋 Notes

- **Priority**: Focus on developer experience and documentation first
- **Impact**: All items are improvements to an already excellent codebase
- **ML Training**: Requires retraining models - schedule when convenient
- **Testing**: Ensure all changes maintain existing quality standards

## 🔗 Related Documentation

- [Architecture Overview](./architecture-overview.md) - System design details
- [Troubleshooting Guide](./troubleshooting.md) - Common issues and solutions
- [ML AI System](./ml-ai-system.md) - Training and AI implementation
