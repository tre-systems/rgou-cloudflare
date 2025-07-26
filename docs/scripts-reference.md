# NPM Scripts Reference

This document provides a comprehensive reference for all npm scripts available in the Royal Game of Ur project.

## Development Scripts

### Core Development

- **`dev`** - Start development server with hot reload
- **`build`** - Build for production (includes WASM assets)
- **`build:cf`** - Build for Cloudflare deployment
- **`start`** - Start production server
- **`nuke`** - Clean install: removes all build artifacts and reinstalls dependencies

### Code Quality

- **`lint`** - Run ESLint to check code quality
- **`lint:fix`** - Run ESLint and automatically fix issues
- **`type-check`** - Run TypeScript type checking

## Build Scripts

### WASM and Rust

- **`build:wasm`** - Build WebAssembly modules for AI
- **`build:wasm-assets`** - Build and copy WASM assets to public directory
- **`build:rust-ai`** - Build Rust AI core for production

### Service Worker

- **`generate:sw`** - Generate service worker with current Git commit hash

## Testing Scripts

### Comprehensive Testing

- **`check`** - Run all tests and checks (lint, type-check, Rust tests, unit tests, e2e tests)
- **`check:slow`** - Run all tests including slow tests (depth 4 AI tests)

### Unit Testing

- **`test`** - Run unit tests with Vitest
- **`test:watch`** - Run unit tests in watch mode
- **`test:coverage`** - Run unit tests with coverage report

### Rust Testing

- **`test:rust`** - Run Rust tests with output
- **`test:rust:slow`** - Run Rust tests including slow tests
- **`test:ml-v2`** - Test ML v2 vs expectiminimax AI (20 games)
- **`test:ml-hybrid`** - Test ML hybrid vs expectiminimax AI (20 games)

### AI Comparison Testing

- **`test:ai-comparison`** - Run comprehensive AI comparison tests
- **`test:ai-comparison:fast`** - Run quick AI comparison (10 games)
- **`test:ai-comparison:comprehensive`** - Run full AI comparison (100 games)

### End-to-End Testing

- **`test:e2e`** - Run Playwright e2e tests
- **`test:e2e:ui`** - Run Playwright e2e tests with UI

## Machine Learning Scripts

### Training Scripts

All training scripts use the unified training system with different presets and backends.

#### General Training

- **`train`** - Train with auto-detected backend and default settings
- **`train:quick`** - Quick training (100 games, 10 epochs)
- **`train:production`** - Production training (2000 games, 100 epochs)

#### Rust Backend Training

- **`train:rust`** - Train using Rust backend with default settings
- **`train:rust:quick`** - Quick Rust training (100 games, 10 epochs)
- **`train:rust:production`** - Production Rust training (2000 games, 100 epochs)

#### PyTorch Backend Training

- **`train:pytorch`** - Train using PyTorch backend with default settings
- **`train:pytorch:quick`** - Quick PyTorch training (100 games, 10 epochs)
- **`train:pytorch:production`** - Production PyTorch training (2000 games, 100 epochs)
- **`train:pytorch:v5`** - Custom PyTorch training (2000 games, 100 epochs, batch size 64)

### AI Evolution

- **`evolve:genetic-params`** - Evolve genetic parameters for AI optimization

### Model Management

- **`load:ml-weights`** - Load and convert ML model weights

## Database Scripts

### Migration

- **`migrate:generate`** - Generate new database migrations
- **`migrate:d1`** - Apply migrations to Cloudflare D1 database
- **`migrate:local`** - Apply migrations to local SQLite database

### Database Setup

- **`db:local:reset`** - Reset local database
- **`db:setup`** - Set up local database (alias for db:local:reset)

## Dependency Management

- **`deps`** - Check for outdated dependencies
- **`deps:update`** - Update all dependencies and clean install

## Training Presets

The unified training system supports three presets:

### Quick Preset

- **Games**: 100
- **Epochs**: 10
- **Batch Size**: 32
- **Use Case**: Testing and development

### Default Preset

- **Games**: 1000
- **Epochs**: 50
- **Batch Size**: 32
- **Use Case**: Standard training runs

### Production Preset

- **Games**: 2000
- **Epochs**: 100
- **Batch Size**: 64
- **Use Case**: Final model training

## Backend Selection

The training system supports three backends:

### Auto (Default)

Automatically selects the best available backend:

- PyTorch if GPU acceleration is available
- Rust if no GPU acceleration

### Rust

- CPU-based training
- Always available
- Slower but more reliable

### PyTorch

- GPU-accelerated training
- Requires CUDA or Apple Metal (MPS)
- Faster training when available

## Usage Examples

```bash
# Quick development training
npm run train:quick

# Production PyTorch training
npm run train:pytorch:production

# Custom Rust training
npm run train:rust -- --num-games 500 --epochs 25

# Run all checks
npm run check

# Test AI comparison
npm run test:ai-comparison:fast
```

## Notes

- All training scripts use `caffeinate` to prevent system sleep during long runs
- Training data is stored in `~/Desktop/rgou-training-data/`
- Model weights are saved to `ml/data/weights/`
- The unified training script provides consistent configuration across backends
- GPU acceleration is required for PyTorch training (CUDA or Apple Metal)
