# ML Directory

This directory contains all machine learning related components for the Royal Game of Ur AI system.

## 🚀 Performance Optimizations

### 🍎 Intelligent CPU Optimization
The ML system automatically detects your system architecture and optimizes CPU utilization:

- **Apple Silicon (M1/M2/M3)**: Uses all 8 performance cores, leaves efficiency cores for system tasks
- **High-core systems (16+)**: Uses most cores but leaves 2 for system responsiveness  
- **Standard systems**: Uses all available cores for maximum performance

### 🔥 GPU Acceleration
- **PyTorch training**: **REQUIRES** GPU acceleration (CUDA or Apple Metal)
- **Rust training**: Uses optimized CPU parallelization
- **Auto-detection**: Automatically selects the best backend for your system

## Structure

```
ml/
├── README.md              # This file
├── config/                # Unified configuration
│   └── training.json      # Training parameters and network architecture
├── scripts/               # Training scripts
│   ├── train.py          # Unified training script (Python/Rust backends)
│   ├── train.sh          # Shell wrapper with caffeinate
│   ├── convert_weights.py # Unified weight conversion utility
│   ├── train_pytorch.py   # PyTorch backend (used by train.py)
│   └── load_pytorch_weights.py # Legacy weight loader (deprecated)
├── data/                  # Training data and configuration
│   ├── weights/           # Trained model weights
│   └── genetic_params/    # Genetic algorithm parameters
```

## Unified Training System

The ML training system has been consolidated into a single, unified interface that supports both Rust and PyTorch backends:

### Quick Start

```bash
# Auto-detect best backend and use default settings
npm run train

# Quick test training
npm run train:quick

# Production training
npm run train:production

# Use specific backend
npm run train:rust
npm run train:pytorch
```

### Advanced Usage

```bash
# Custom training with specific parameters
./ml/scripts/train.sh --backend pytorch --num-games 1500 --epochs 75

# Quick test with Rust backend
./ml/scripts/train.sh --backend rust --preset quick

# Production training with custom output
./ml/scripts/train.sh --preset production --output my_weights.json
```

### Training Presets

- **default**: 1000 games, 50 epochs, 32 batch size
- **quick**: 100 games, 10 epochs, 32 batch size
- **production**: 2000 games, 100 epochs, 64 batch size

### Backend Selection

- **auto**: Automatically selects PyTorch (if GPU available) or Rust
- **pytorch**: Uses PyTorch with **required** GPU acceleration (CUDA/MPS)
- **rust**: Uses pure Rust implementation with optimized CPU parallelization

### Performance Characteristics

| Backend | CPU Usage | GPU Usage | Best For |
|---------|-----------|-----------|----------|
| PyTorch | 1 core + GPU | **Required** | High-performance training with GPU |
| Rust | All performance cores | None | CPU-optimized training, no GPU required |

## Weight Management

### Converting Weights

```bash
# Convert weights to unified format and copy to public directory
npm run load:ml-weights ml/data/weights/my_weights.json --copy-to-public

# Convert between formats
python3 ml/scripts/convert_weights.py input.json --format rust --output rust_weights.json

# Validate weights
python3 ml/scripts/convert_weights.py input.json --validate
```

### Weight Formats

- **unified**: Standard format used by the application
- **pytorch**: PyTorch-specific format
- **rust**: Rust-specific format

## Configuration

All training parameters are centralized in `ml/config/training.json`:

```json
{
  "network_architecture": {
    "input_size": 150,
    "hidden_sizes": [256, 128, 64, 32],
    "value_output_size": 1,
    "policy_output_size": 7
  },
  "training_defaults": {
    "num_games": 1000,
    "epochs": 50,
    "batch_size": 32,
    "learning_rate": 0.001
  }
}
```

## Features

- **🎯 Unified Interface** - Single training script for all backends
- **🎮 GPU Acceleration** - Automatic CUDA/MPS detection with PyTorch
- **🦀 Rust Integration** - Seamless integration with existing Rust system
- **📁 Organized Storage** - Clear separation of scripts, weights, and data
- **⚡ Fast Training** - Optimized backends with shared configuration
- **🔄 Easy Conversion** - Automatic weight format conversion
- **🧪 Validation** - Built-in weight validation and testing

## Integration

The ML system integrates with the main application:

1. **Train** using unified script: `npm run train`
2. **Convert** weights: `npm run load:ml-weights`
3. **Use** in game via the existing Rust inference system

## Migration from Old System

The old training scripts have been deprecated in favor of the unified system:

- `train-pytorch.sh` → `train.sh --backend pytorch`
- `train-ml.sh` → `train.sh --backend rust`
- `load-ml-weights.ts` → `convert_weights.py`

See [ML System Overview](../docs/ml-system-overview.md) for detailed usage instructions.
