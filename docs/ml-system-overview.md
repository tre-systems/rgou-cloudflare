# ML System Overview

_Comprehensive overview of the machine learning system with PyTorch and Rust training options._

## System Architecture

The project offers **two training systems** for maximum flexibility and performance:

### 🚀 PyTorch Training (Recommended)

- **GPU acceleration** - Automatic CUDA/MPS detection and utilization
- **Rust data generation** - Fast parallel game simulation using all CPU cores
- **Optimized training** - PyTorch's highly optimized neural network operations
- **Advanced features** - Dropout, Adam optimizer, early stopping
- **Seamless integration** - Weights automatically compatible with Rust system

### 🦀 Rust Training (Legacy)

- **Pure Rust implementation** - No Python dependencies
- **Optimized CPU parallel processing** - Uses all available cores efficiently
- **Feature-based separation** - Training code excluded from WASM
- **Single source of truth** - Same code for training and inference
- **Cross-platform** - Works on macOS, Linux, Windows
- **Apple Silicon optimization** - Uses 8 performance cores on M1/M2/M3

## Directory Structure

```
ml/
├── README.md                    # ML directory documentation
├── scripts/                     # Training scripts
│   ├── train_pytorch.py        # Main PyTorch training script
│   ├── train-pytorch.sh        # Shell wrapper with caffeinate
│   └── load_pytorch_weights.py # Weight conversion utility
├── weights/                     # Trained model weights
│   └── *.json                  # Weight files (gitignored)
└── data/                        # Training data and configuration
    ├── training/               # Training datasets
    ├── genetic_params/         # Genetic algorithm parameters
    └── weights/                # Legacy weights (moved to parent)
```

## Quick Start Commands

### PyTorch Training

```bash
# Quick test (100 games, 10 epochs)
npm run train:pytorch:test

# Standard training (1000 games, 50 epochs)
npm run train:pytorch

# Production training (2000 games, 75 epochs)
npm run train:pytorch:production

# Custom training
./ml/scripts/train-pytorch.sh 1500 60 0.001 64 4 custom_weights.json
```

### Rust Training

```bash
# Quick test (100 games, 5 epochs)
npm run train:rust:quick

# Standard training (1000 games, 50 epochs)
npm run train:rust

# Production training (5000 games, 100 epochs)
npm run train:rust:production

# Custom training
cd worker/rust_ai_core && cargo run --bin train --release --features training -- train 2000 75 0.001 32 4 custom_weights.json
```

### Weight Management

```bash
# Convert PyTorch weights to Rust format
python3 ml/scripts/load_pytorch_weights.py ml/weights/ml_ai_weights_v1.json --test

# Load weights for browser use
npm run load:ml-weights ml/weights/ml_ai_weights_v1_rust.json
```

## Performance Comparison

| Aspect                 | PyTorch Training              | Rust Training           |
| ---------------------- | ----------------------------- | ----------------------- |
| **Training Speed**     | 🚀 **10-50x faster** (GPU)    | ⚡ Fast (CPU optimized) |
| **GPU Support**        | ✅ **Full CUDA acceleration** | ❌ CPU only             |
| **Memory Usage**       | 📊 Higher (GPU memory)        | 📊 Lower (CPU memory)   |
| **Dependencies**       | 🐍 Python + PyTorch           | 🦀 Pure Rust            |
| **Setup Complexity**   | 🔧 Moderate                   | 🔧 Simple               |
| **Cross-platform**     | ✅ Yes                        | ✅ Yes                  |
| **WASM Compatibility** | ✅ Via conversion             | ✅ Direct               |

## Neural Network Architecture

Both systems use the same neural network architecture:

- **Input**: 150-dimensional feature vector
- **Hidden layers**: [256, 128, 64, 32] (ReLU activation)
- **Value output**: 1 neuron (tanh activation)
- **Policy output**: 7 neurons (softmax activation)
- **Total parameters**: ~81K (value) + ~82K (policy)

### PyTorch Optimizations

- **Dropout layers** - Prevents overfitting
- **Adam optimizer** - Adaptive learning rate
- **GPU acceleration** - Automatic CUDA utilization
- **Batch processing** - Efficient parallel training
- **Early stopping** - Prevents overtraining

## Training Data Flow

### PyTorch Training Pipeline

1. **Rust Data Generation** - Fast parallel game simulation using all CPU cores
2. **JSON Export** - Training data saved to `~/Desktop/rgou-training-data/`
3. **PyTorch Loading** - Data loaded into PyTorch DataLoaders
4. **GPU Training** - Neural network training with GPU acceleration
5. **Weight Export** - Trained weights saved to `ml/weights/`
6. **Conversion** - Optional conversion to Rust-compatible format

### Rust Training Pipeline

1. **Direct Training** - Game simulation and training in single process
2. **CPU Optimization** - Uses all available CPU cores efficiently
3. **Weight Export** - Trained weights saved directly to output file

## File Locations

### Training Scripts

- **PyTorch**: `ml/scripts/train_pytorch.py`
- **Shell wrapper**: `ml/scripts/train-pytorch.sh`
- **Weight converter**: `ml/scripts/load_pytorch_weights.py`

### Weights Storage

- **PyTorch weights**: `ml/weights/*.json`
- **Rust weights**: `ml/weights/*.json` (converted)
- **Temporary data**: `~/Desktop/rgou-training-data/`

### Documentation

- **System overview**: `docs/ml-system-overview.md`
- **PyTorch training**: `docs/pytorch-training.md`
- **Training system**: `docs/training-system.md`
- **ML directory**: `ml/README.md`

## Integration with Main Application

1. **Train** with PyTorch or Rust using the provided scripts
2. **Convert** PyTorch weights to Rust format if needed
3. **Load** weights into browser using `npm run load:ml-weights`
4. **Use** in game via the existing Rust inference system

## Troubleshooting

### Common Issues

- **GPU not detected**: Ensure PyTorch is installed with GPU support
- **Rust compilation errors**: Run `cargo clean` and rebuild
- **Memory issues**: Reduce batch size or number of games
- **Slow training**: Use PyTorch with GPU for significant speedup

### Performance Tips

- **Use PyTorch for production**: 10-50x faster with GPU
- **Use Rust for development**: Simpler setup, no Python dependencies
- **Optimize batch size**: Balance memory usage and training speed
- **Monitor GPU usage**: Ensure GPU is being utilized effectively

## Next Steps

1. **Choose training system** based on your needs (PyTorch recommended)
2. **Install dependencies** for your chosen system
3. **Run quick test** to verify setup
4. **Train production model** with appropriate parameters
5. **Load weights** into browser for testing
6. **Iterate and improve** based on performance

See individual documentation files for detailed usage instructions.
