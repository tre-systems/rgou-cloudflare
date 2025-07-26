# Documentation

This directory contains comprehensive documentation for the Royal Game of Ur project.

## 📚 Documentation Structure

### Core Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design, components, deployment, and infrastructure
- **[AI-SYSTEM.md](./AI-SYSTEM.md)** - Complete AI system guide including Classic AI, ML AI, testing, and development history
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development workflow, testing strategies, troubleshooting, and best practices
- **[GAME-GUIDE.md](./GAME-GUIDE.md)** - Game rules, strategy, historical context, and user information

### Additional Files

- **[TODO.md](./TODO.md)** - Consolidated task list and improvements

## 🎯 Quick Reference

### For New Developers

1. Start with [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system design
2. Read [AI-SYSTEM.md](./AI-SYSTEM.md) for comprehensive AI implementation details
3. Check [GAME-GUIDE.md](./GAME-GUIDE.md) for game mechanics and strategy
4. Use [DEVELOPMENT.md](./DEVELOPMENT.md) for development workflow and troubleshooting

### For AI Development

1. Review [AI-SYSTEM.md](./AI-SYSTEM.md) for complete AI system information
2. Check [DEVELOPMENT.md](./DEVELOPMENT.md) for training and testing procedures

### For Testing

1. Read [DEVELOPMENT.md](./DEVELOPMENT.md) for comprehensive testing strategies
2. Use the troubleshooting section for common issues

## 📊 Performance Summary

For the latest, detailed AI performance results (win rates, speed, and recommendations), see [AI-MATRIX-RESULTS.md](./AI-MATRIX-RESULTS.md). All stats are generated automatically by the AI matrix test and kept up to date.

## 🚀 Latest Training Options

### PyTorch Training (Recommended)

```bash
# Quick test (100 games, 10 epochs)
npm run train:pytorch:quick

# Standard training (1000 games, 50 epochs)
npm run train:pytorch

# Production training (2000 games, 100 epochs)
npm run train:pytorch:production

# v5 training (2000 games, 100 epochs, ~30 min)
npm run train:pytorch:v5
```

### Rust Training (Legacy)

```bash
# Quick test (100 games, 10 epochs)
npm run train:rust:quick

# Standard training (1000 games, 50 epochs)
npm run train:rust

# Production training (2000 games, 100 epochs)
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

- **Significant improvement** over default parameters
- **Evolution time:** ~42 minutes
- **Validation confirmed:** 1000-game test confirms improvement

For detailed performance metrics, see [AI-MATRIX-RESULTS.md](./AI-MATRIX-RESULTS.md).

**Key Parameter Changes:**

- `win_score`: 10000 → 8354 (-1646)
- `finished_piece_value`: 1000 → 638 (-362)
- `position_weight`: 15 → 30 (+15)
- `rosette_control_bonus`: 40 → 61 (+21)
- `capture_bonus`: 35 → 49 (+14)

The evolved parameters significantly outperform the defaults and are now used in production.

## 🔄 Recent Updates

- **July 2025**: Consolidated documentation into 4 comprehensive files
- **July 2025**: Successful genetic parameter evolution - evolved parameters significantly outperform defaults
- **July 2025**: PyTorch V5 model achieves strong performance against Classic AI
- **July 2025**: Pure Rust training migration with 10-20x performance improvements
- **July 2025**: Apple Silicon GPU optimization for ML training

## 📝 Contributing

When updating documentation:

1. Keep information concise and to the point
2. Update the appropriate consolidated file
3. Maintain cross-references between documents
4. Update this README when adding new documentation

## 📁 File Organization

### Consolidated Files

- **ARCHITECTURE.md**: System design, components, deployment, database, and infrastructure
- **AI-SYSTEM.md**: Complete AI system including Classic AI, ML AI, testing, training, and development history
- **DEVELOPMENT.md**: Development workflow, testing strategies, troubleshooting, and best practices
- **GAME-GUIDE.md**: Game rules, strategy, historical context, and user information

### Removed Files (Consolidated)

- `architecture-overview.md` → Consolidated into `ARCHITECTURE.md`
- `ai-system.md` → Consolidated into `AI-SYSTEM.md`
- `ml-system-overview.md` → Consolidated into `AI-SYSTEM.md`
- `testing-strategy.md` → Consolidated into `DEVELOPMENT.md`
- `ai-testing-strategy.md` → Consolidated into `AI-SYSTEM.md`
- `cloudflare-worker-infrastructure.md` → Consolidated into `ARCHITECTURE.md`
- `scripts-reference.md` → Consolidated into `DEVELOPMENT.md`
- `game-rules-strategy.md` → Consolidated into `GAME-GUIDE.md`
- `troubleshooting.md` → Consolidated into `DEVELOPMENT.md`
- `ai-development-history.md` → Consolidated into `AI-SYSTEM.md`

## Testing and Quality

- All Rust doc tests are fast and reliable (minimal config, no long-running examples)
- All unit, integration, and doc tests pass as of this commit
- High test coverage is maintained (see coverage report)
- E2E tests (Playwright) are robust and verify real database saves
