# Development Guide

This document provides a comprehensive guide for developing, testing, and maintaining the Royal Game of Ur project.

## Development Workflow

### Core Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for Cloudflare deployment
npm run build:cf

# Clean install (reset environment)
npm run nuke
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check

# Run all checks (lint, type-check, tests)
npm run check
```

## Build System

### WASM and Rust

```bash
# Build WebAssembly modules
npm run build:wasm

# Build and copy WASM assets
npm run build:wasm-assets

# Build Rust AI core
npm run build:rust-ai
```

### Service Worker

```bash
# Generate service worker with Git commit hash
npm run generate:sw
```

## Testing Strategy

### Test Philosophy

- Focus on high-value, low-maintenance tests
- Prefer deterministic, pure function tests
- Use integration tests for workflows
- Use snapshot tests for regression detection

### Test Categories

| Test Type         | What to Test                | Tool       | Value  | Maintenance |
| ----------------- | --------------------------- | ---------- | ------ | ----------- |
| Pure logic        | Game rules, reducers        | Vitest     | High   | Low         |
| Schema validation | Zod schemas, domain types   | Vitest     | High   | Low         |
| Snapshots         | Key game states             | Vitest     | Medium | Low         |
| Store integration | Zustand actions/transitions | Vitest     | Medium | Medium      |
| UI smoke          | App loads, basic flows      | Playwright | Medium | Low         |
| Full E2E          | Full game, random flows     | Avoid      | Low    | High        |

### Unit Testing

```bash
# Run unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test Locations**:

- `src/lib/__tests__/game-logic.test.ts` - Pure functions and business logic
- `src/lib/__tests__/schemas.test.ts` - Zod schemas and type safety
- `src/lib/__tests__/game-store.test.ts` - Game store and move sequences

### Rust Testing

```bash
# Run Rust tests
npm run test:rust

# Run slow tests (depth 4)
npm run test:rust:slow

# Test specific ML models
npm run test:ml-v2
npm run test:ml-hybrid
```

### AI Testing

```bash
# Quick AI comparison (10 games)
npm run test:ai-comparison:fast

# Comprehensive AI comparison (100 games)
npm run test:ai-comparison:comprehensive

# Matrix test only
cd worker/rust_ai_core
NUM_GAMES=20 cargo test test_ai_matrix -- --nocapture
```

### End-to-End Testing

```bash
# Run E2E tests
npm run test:e2e

# Debug with UI
npm run test:e2e:ui
```

**E2E Best Practices**:

- Use `data-testid` attributes for robust selectors
- Focus on critical flows, avoid edge cases
- Verify actual database saves, don't mock
- Test mobile layout and game completion

## Machine Learning Development

### Training System

The project uses a unified training system with different presets and backends.

#### Training Presets

**Quick Preset**:

- Games: 100
- Epochs: 10
- Batch Size: 32
- Use Case: Testing and development

**Default Preset**:

- Games: 1000
- Epochs: 50
- Batch Size: 32
- Use Case: Standard training runs

**Production Preset**:

- Games: 2000
- Epochs: 100
- Batch Size: 64
- Use Case: Final model training

#### Backend Selection

**Auto (Default)**:

- Automatically selects best available backend
- PyTorch if GPU acceleration is available
- Rust if no GPU acceleration

**Rust**:

- CPU-based training
- Always available
- Slower but more reliable

**PyTorch**:

- GPU-accelerated training
- Requires CUDA or Apple Metal (MPS)
- Faster training when available

#### Training Commands

```bash
# General training
npm run train
npm run train:quick
npm run train:production

# Rust backend
npm run train:rust
npm run train:rust:quick
npm run train:rust:production

# PyTorch backend
npm run train:pytorch
npm run train:pytorch:quick
npm run train:pytorch:production

# Custom training
npm run train:rust -- --num-games 500 --epochs 25
```

### AI Evolution

```bash
# Evolve genetic parameters
npm run evolve:genetic-params

# Validate genetic parameters
npm run validate:genetic-params
```

### Model Management

```bash
# Load and convert ML model weights
npm run load:ml-weights
```

## Database Development

### Local Development

```bash
# Reset local database
npm run db:local:reset

# Setup local database (alias)
npm run db:setup

# Apply local migrations
npm run migrate:local
```

### Production

```bash
# Generate new migrations
npm run migrate:generate

# Apply migrations to Cloudflare D1
npm run migrate:d1
```

## Dependency Management

```bash
# Check for outdated dependencies
npm run deps

# Update all dependencies and clean install
npm run deps:update
```

## Troubleshooting

### Common Issues and Solutions

#### Cloudflare Deployment Issues

**Problem**: App works locally but fails on Cloudflare.

**Solution**:

```bash
# Pin exact dependency versions
npm install --save-exact next@15.3.4 @opennextjs/cloudflare@1.3.1 wrangler@4.22.0

# Clean and rebuild
rm -rf .next .open-next .wrangler
npm run build:cf
```

#### WASM Build Failures

**Solution**:

```bash
# Install correct wasm-pack version
cargo install wasm-pack --version 0.12.1 --locked

# Clean and rebuild
cd worker/rust_ai_core
cargo clean
wasm-pack build --target web --out-name rgou_ai_worker -- --features wasm
```

#### ML AI Not Working

**Solution**:

```bash
# Check WASM files
ls -la public/wasm/

# Load weights
npm run load:ml-weights
```

#### E2E Tests Failing

**Solution**:

```bash
# Install Playwright browsers
npx playwright install --with-deps

# Run with UI for debugging
npm run test:e2e:ui
```

#### Performance Issues

**Solution**:

```bash
# Use caching
npm ci --cache .npm

# Clean and rebuild
npm run nuke
```

### Quick Fixes

| Issue            | Quick Fix                   |
| ---------------- | --------------------------- |
| WASM not loading | `npm run build:wasm-assets` |
| Database errors  | `npm run migrate:local`     |
| ML AI broken     | `npm run load:ml-weights`   |
| Tests failing    | `npm run nuke`              |
| Build slow       | `npm ci --cache .npm`       |
| Deployment fails | Pin dependency versions     |

### Environment Reset

```bash
# Complete environment reset
npm run nuke
```

## Development Environment

### Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0
- Rust (for AI development)
- wasm-pack (for WASM builds)

### Local Setup

1. **Clone and install**:

   ```bash
   git clone <repository>
   cd rgou-cloudflare
   npm install
   ```

2. **Setup database**:

   ```bash
   npm run db:setup
   ```

3. **Build WASM assets**:

   ```bash
   npm run build:wasm-assets
   ```

4. **Start development**:
   ```bash
   npm run dev
   ```

### Development Tools

**Dev-only features** (only on localhost):

- AI diagnostics panel
- AI toggle controls
- Reset/test buttons
- Enhanced logging

**Production features**:

- Clean UI without development tools
- Classic AI as default opponent
- Optimized builds

## Performance Optimization

### Build Performance

- Use `npm ci --cache .npm` for faster installs
- WASM builds are cached in `worker/rust_ai_core/target/`
- Service worker generation includes Git commit hash for cache busting

### Runtime Performance

- AI runs in Web Workers to avoid blocking UI
- Transposition tables provide significant speedup for repeated positions
- ML models are optimized for inference speed

### Testing Performance

- Unit tests run in parallel
- E2E tests use local SQLite for speed
- AI matrix tests are configurable for different time constraints

## Best Practices

### Code Quality

- Always run `npm run check` before committing
- Fix linting issues automatically with `npm run lint:fix`
- Use TypeScript strict mode for better type safety
- Prefer pure functions for game logic

### Testing

- Write tests for pure functions and business logic
- Use integration tests for complex workflows
- Avoid testing UI components (high maintenance, low value)
- Use `data-testid` attributes for E2E testing

### AI Development

- Use evolved genetic parameters for Classic AI
- Test ML models against strong opponents (EMM-3)
- Validate training results with competitive testing
- Monitor performance metrics over time

### Database

- Use migrations for schema changes
- Test database operations in E2E tests
- Use local SQLite for development
- Backup production data regularly

## Continuous Integration

### GitHub Actions

The project uses GitHub Actions for automated testing:

```yaml
- name: Run all checks
  run: npm run check

- name: Run slow tests
  run: npm run check:slow
```

### Pre-commit Hooks

Recommended pre-commit checks:

1. `npm run lint`
2. `npm run type-check`
3. `npm run test`
4. `npm run build:wasm-assets`

## Summary

This development guide provides comprehensive coverage of the development workflow, testing strategies, and troubleshooting procedures. The project emphasizes:

- **High-quality testing** with focus on pure functions and integration tests
- **Comprehensive AI development** with multiple training backends and testing frameworks
- **Robust build system** with WASM compilation and deployment automation
- **Efficient troubleshooting** with quick fixes and environment reset capabilities
- **Performance optimization** at both build and runtime levels

For specific AI system details, see [AI-SYSTEM.md](./AI-SYSTEM.md). For architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).
