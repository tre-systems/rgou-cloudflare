# ML Directory

This directory contains all machine learning related components for the Royal Game of Ur AI system.

## Structure

```
ml/
├── README.md              # This file
├── scripts/               # Training scripts
│   ├── train_pytorch.py   # Main PyTorch training script
│   ├── train-pytorch.sh   # Shell wrapper with caffeinate
│   └── load_pytorch_weights.py # Weight conversion utility
├── weights/               # Trained model weights
│   └── *.json            # Weight files (gitignored)
└── data/                  # Training data and configuration
    ├── training/          # Training datasets
    ├── genetic_params/    # Genetic algorithm parameters
    └── weights/           # Legacy weights (moved to parent)
```

## Training Scripts

### PyTorch Training

The PyTorch training system provides GPU-accelerated neural network training:

```bash
# Quick test
npm run train:pytorch:test

# Standard training
npm run train:pytorch

# Production training
npm run train:pytorch:production

# Custom training
./ml/scripts/train-pytorch.sh 1500 60 0.001 64 4 custom_weights.json
```

### Weight Conversion

Convert PyTorch weights to Rust-compatible format:

```bash
# Convert and test
python3 ml/scripts/load_pytorch_weights.py ml/weights/ml_ai_weights_v1.json --test

# Convert with custom output
python3 ml/scripts/load_pytorch_weights.py ml/weights/ml_ai_weights_v1.json rust_weights.json
```

## Weights Directory

All trained model weights are stored in `ml/weights/`:

- **PyTorch weights** - Direct output from PyTorch training
- **Rust weights** - Converted weights compatible with Rust inference
- **Test weights** - Small weights for validation and testing

## Features

- **🎮 GPU Acceleration** - Automatic CUDA/MPS detection
- **🦀 Rust Integration** - Seamless integration with existing Rust system
- **📁 Organized Storage** - Clear separation of scripts, weights, and data
- **⚡ Fast Training** - PyTorch optimization with Rust data generation
- **🔄 Easy Conversion** - Automatic weight format conversion

## Integration

The ML system integrates with the main application:

1. **Train** with PyTorch using `ml/scripts/train-pytorch.sh`
2. **Convert** weights using `ml/scripts/load_pytorch_weights.py`
3. **Load** into browser using `npm run load:ml-weights`
4. **Use** in game via the existing Rust inference system

See [ML System Overview](../docs/ml-system-overview.md) for detailed usage instructions.
