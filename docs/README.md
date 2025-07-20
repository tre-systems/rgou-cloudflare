# Documentation

This directory contains comprehensive documentation for the Royal Game of Ur project.

## 📚 Documentation Structure

### Core System

- **[Architecture Overview](./architecture-overview.md)** - System design, components, and game statistics
- **[AI System](./ai-system.md)** - Classic expectiminimax AI and ML AI implementation
- **[Training System](./training-system.md)** - Machine learning training system with Mac optimization
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
2. Study [Training System](./training-system.md) for ML training
3. Check [AI System](./ai-system.md) for current performance data

### For Testing

1. Read [Testing Strategy](./testing-strategy.md) for testing approach
2. Use [Troubleshooting Guide](./troubleshooting.md) for test issues

## 📊 Performance Summary

### Classic AI Performance

| AI Type                | Win Rate  | Search Depth | Speed   | Notes                      |
| ---------------------- | --------- | ------------ | ------- | -------------------------- |
| **Classic AI (EMM-4)** | **75.0%** | 4-ply        | 370ms   | **Maximum strength**       |
| **Classic AI (EMM-3)** | **70.0%** | 3-ply        | 15ms    | **Optimal - Best balance** |
| Classic AI (EMM-2)     | 98.0%     | 2-ply        | Instant | Strong alternative         |

### ML AI Models Performance

| Model      | Win Rate vs EMM-3 | Status                  |
| ---------- | ----------------- | ----------------------- |
| **v2**     | **44%**           | ✅ **Best Performance** |
| **Fast**   | 36%               | Competitive             |
| **v4**     | 32%               | ⚠️ Needs Improvement    |
| **Hybrid** | 30%               | ⚠️ Needs Improvement    |

## 🔄 Recent Updates

- **July 2025**: Consolidated documentation structure
- **July 2025**: Added pure Rust training system documentation
- **July 2025**: Updated AI development history with recent developments
- **July 2025**: Removed redundant files and consolidated information
- **July 2025**: Integrated Mac optimization and training monitoring into training system
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

- **AI System**: Combined Classic AI and ML AI information
- **Training System**: Includes Mac optimization and training monitoring
- **Architecture Overview**: Includes game statistics and database schema
- **Testing Strategy**: Includes AI performance testing and test configuration

### Removed Files

- `ml-ai-system.md` → Consolidated into `ai-system.md`
- `ai-performance.md` → Consolidated into `ai-system.md` and `testing-strategy.md`
- `test-configuration-guide.md` → Consolidated into `testing-strategy.md`
- `checking-training-status.md` → Consolidated into `training-system.md`
- `mac-optimization-guide.md` → Consolidated into `training-system.md`
- `game-statistics.md` → Consolidated into `architecture-overview.md`
