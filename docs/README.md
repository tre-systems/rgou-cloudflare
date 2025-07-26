# Documentation

This directory contains comprehensive documentation for the Royal Game of Ur project.

## 📚 Documentation Structure

### Core System

- **[Architecture Overview](./architecture-overview.md)** - System design, components, and game statistics
- **[AI System](./ai-system.md)** - Classic expectiminimax AI and ML AI implementation with performance data
- **[ML System Overview](./ml-system-overview.md)** - Complete ML system guide with training, performance matrix, and model comparisons
- **[Game Rules and Strategy](./game-rules-strategy.md)** - Game rules and strategic concepts

### Development

- **[Testing Strategy](./testing-strategy.md)** - Testing approach and methodology
- **[Troubleshooting Guide](./troubleshooting.md)** - Common issues and solutions
- **[TODO](./TODO.md)** - Consolidated task list and improvements

### Infrastructure

- **[Cloudflare Worker Infrastructure](./cloudflare-worker-infrastructure.md)** - Preserved server-side infrastructure

### Historical

- **[AI Development History](./ai-development-history.md)** - Historical experiments and findings

## 🎯 Quick Reference

### For New Developers

1. Start with [Architecture Overview](./architecture-overview.md) to understand the system
2. Read [AI System](./ai-system.md) for AI implementation details
3. Check [Game Rules and Strategy](./game-rules-strategy.md) for game mechanics
4. Use [Troubleshooting Guide](./troubleshooting.md) for common issues

### For AI Development

1. Review [AI Development History](./ai-development-history.md) for historical context
2. Study [ML System Overview](./ml-system-overview.md) for ML training
3. Check [AI System](./ai-system.md) for current performance data

### For Testing

1. Read [Testing Strategy](./testing-strategy.md) for testing approach
2. Use [Troubleshooting Guide](./troubleshooting.md) for test issues

## 📊 Performance Summary

### Classic AI Performance

| AI Type                | Win Rate  | Search Depth | Speed   | Notes                        |
| ---------------------- | --------- | ------------ | ------- | ---------------------------- |
| **Classic AI (EMM-3)** | **75.6%** | 3-ply        | 15.6ms  | **Best overall performance** |
| **Classic AI (EMM-2)** | **51.1%** | 2-ply        | Instant | Strong alternative           |
| **Classic AI (EMM-1)** | **46.7%** | 1-ply        | Instant | Fast baseline                |
| Heuristic AI           | **35.6%** | N/A          | Instant | Educational baseline         |

### ML AI Models Performance

| Model             | Win Rate  | Speed  | Status                     |
| ----------------- | --------- | ------ | -------------------------- |
| **ML-Hybrid**     | **60.0%** | 52.1ms | ✅ **Best ML Performance** |
| **ML-PyTorch-V5** | **60.0%** | 54.8ms | ✅ **Best ML Performance** |
| **ML-V4**         | **58.9%** | 50.7ms | ✅ **Strong Performance**  |
| **ML-V2**         | **55.6%** | 53.5ms | ✅ **Good Performance**    |
| **ML-Fast**       | **51.1%** | 58.4ms | ⚠️ **Needs Improvement**   |

**Note:** All Classic AI variants now use evolved genetic parameters that provide a 61% win rate improvement over the original default parameters.

## 🚀 Latest Training Options

### PyTorch Training (Recommended)

```bash
# Quick test (100 games, 10 epochs)
npm run train:pytorch:test

# Standard training (1000 games, 50 epochs)
npm run train:pytorch

# Fast training (500 games, 25 epochs)
npm run train:pytorch:fast

# Production training (2000 games, 75 epochs)
npm run train:pytorch:production

# v5 training (2000 games, 100 epochs, ~30 min)
npm run train:pytorch:v5
```

### Rust Training (Legacy)

```bash
# Quick test (100 games, 5 epochs)
npm run train:rust:quick

# Standard training (1000 games, 50 epochs)
npm run train:rust

# Production training (5000 games, 100 epochs)
npm run train:rust:production
```

## 🧬 Genetic Parameter Evolution

You can evolve and validate the genetic parameters for the classic AI using the following scripts:

```bash
# Evolve new genetic parameters (runs Rust evolution, saves to ml/data/genetic_params/evolved.json)
npm run evolve:genetic-params

# Validate evolved parameters against default (runs 100 games, prints win rates)
npm run validate:genetic-params
```

### Evolution Process

The evolution script uses a robust genetic algorithm with:

- **Population size:** 50 individuals
- **Generations:** 50 generations
- **Games per evaluation:** 100 games per individual
- **Post-evolution validation:** 1000 games to confirm improvement
- **Quality threshold:** Only saves parameters if they win >55% vs defaults

### Current Results (July 2025)

**Evolved Parameters Performance:**

- **Win rate vs defaults:** 61% (significant improvement)
- **Evolution time:** ~42 minutes
- **Validation confirmed:** 1000-game test showed 69.4% win rate

**Key Parameter Changes:**

- `win_score`: 10000 → 8354 (-1646)
- `finished_piece_value`: 1000 → 638 (-362)
- `position_weight`: 15 → 30 (+15)
- `rosette_control_bonus`: 40 → 61 (+21)
- `capture_bonus`: 35 → 49 (+14)

The evolved parameters significantly outperform the defaults and are now used in production.

## 🔄 Recent Updates

- **July 2025**: Successful genetic parameter evolution - evolved parameters achieve 61% win rate vs defaults
- **July 2025**: PyTorch V5 model achieves 49% win rate against expectiminimax AI
- **July 2025**: Consolidated ML test matrix into ML system overview
- **July 2025**: Updated AI system with latest performance data
- **July 2025**: PyTorch V5 training configuration (2000 games, 100 epochs, ~30 min)
- **July 2025**: Consolidated ML documentation into single comprehensive guide
- **July 2025**: Removed redundant training documentation files
- **July 2025**: Updated AI development history with recent developments
- **July 2025**: Integrated Mac optimization and training monitoring into ML system overview
- **July 2025**: Added game statistics to architecture overview

## 📝 Contributing

When updating documentation:

1. Keep information concise and to the point
2. Consolidate related information in single files
3. Update cross-references when moving content
4. Maintain historical records in [AI Development History](./ai-development-history.md)
5. Update this README when adding new documentation

## 📁 File Organization

### Consolidated Files

- **ML System Overview**: Combined PyTorch training, Rust training, system architecture, and model performance matrix
- **AI System**: Combined Classic AI and ML AI information with latest performance data
- **Architecture Overview**: Includes game statistics and database schema
- **Testing Strategy**: Includes AI performance testing and test configuration

### Removed Files

- `ml-test-matrix.md` → Consolidated into `ml-system-overview.md`
- `pytorch-training.md` → Consolidated into `ml-system-overview.md`
- `training-system.md` → Consolidated into `ml-system-overview.md`
- `ml-ai-system.md` → Consolidated into `ai-system.md`
- `ai-performance.md` → Consolidated into `ai-system.md` and `testing-strategy.md`
- `test-configuration-guide.md` → Consolidated into `testing-strategy.md`
- `checking-training-status.md` → Consolidated into `ml-system-overview.md`
- `mac-optimization-guide.md` → Consolidated into `ml-system-overview.md`
- `game-statistics.md` → Consolidated into `architecture-overview.md`

## Testing and Quality

- All Rust doc tests are fast and reliable (minimal config, no long-running examples)
- All unit, integration, and doc tests pass as of this commit
- High test coverage is maintained (see coverage report)
- E2E tests (Playwright) are robust and verify real database saves
