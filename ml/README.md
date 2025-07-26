# ML Directory

This directory contains all machine learning related components for the Royal Game of Ur AI system.

## 🚀 Quick Start

### For Newcomers

If you're new to the project and want to try ML training:

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Quick test training (5 minutes)
npm run train:quick

# 3. Standard training (30 minutes)
npm run train:pytorch

# 4. Check results
ls ml/data/weights/
```

### Prerequisites

- **Python 3.8+** with pip
- **Rust & Cargo** (for data generation)
- **GPU** (recommended for PyTorch training)
  - **Apple Silicon**: Apple Metal (MPS) support
  - **NVIDIA**: CUDA support
  - **CPU-only**: Use Rust backend instead

## 🍎 Performance Optimizations

### Intelligent CPU Optimization

The ML system automatically detects your system architecture and optimizes CPU utilization:

- **Apple Silicon (M1/M2/M3)**: Uses all 8 performance cores, leaves efficiency cores for system tasks
- **High-core systems (16+)**: Uses most cores but leaves 2 for system responsiveness
- **Standard systems**: Uses all available cores for maximum performance

### GPU Acceleration

- **PyTorch training**: **REQUIRES** GPU acceleration (CUDA or Apple Metal)
- **Rust training**: Uses optimized CPU parallelization
- **Auto-detection**: Automatically selects the best backend for your system

## 📁 Structure

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

## 🧠 Training System

The ML training system has been consolidated into a single, unified interface that supports both Rust and PyTorch backends:

### Quick Start Commands

```bash
# Auto-detect best backend and use default settings
npm run train

# Quick test training (100 games, 10 epochs)
npm run train:quick

# Standard training (1000 games, 50 epochs)
npm run train:pytorch

# Production training (2000 games, 100 epochs)
npm run train:pytorch:production
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

| Backend | CPU Usage             | GPU Usage    | Best For                                |
| ------- | --------------------- | ------------ | --------------------------------------- |
| PyTorch | 1 core + GPU          | **Required** | High-performance training with GPU      |
| Rust    | All performance cores | None         | CPU-optimized training, no GPU required |

## 📊 Model Management

### Converting Weights

```bash
# Convert weights to unified format and copy to public directory
npm run load:ml-weights ml/data/weights/my_weights.json --copy-to-public

# Convert between formats
python3 ml/scripts/convert_weights.py input.json --format rust --output rust_weights.json
```

### Current Models

| Model          | Win Rate vs EMM-3 | Training Games | Epochs | Status                     |
| -------------- | ----------------- | -------------- | ------ | -------------------------- |
| **PyTorch V5** | **60.0%**         | 2000           | 100    | ✅ **Best ML Performance** |
| **ML-Hybrid**  | **60.0%**         | 2000           | 100    | ✅ **Best ML Performance** |
| **ML-V4**      | **58.9%**         | 5000           | 100    | ✅ **Strong Performance**  |
| **ML-V2**      | **55.6%**         | 1000           | 50     | ✅ **Good Performance**    |
| **ML-Fast**    | **51.1%**         | 500            | 25     | ⚠️ **Needs Improvement**   |

## 🧬 Genetic Parameter Evolution

You can evolve and validate the genetic parameters for the classic AI:

```bash
# Evolve new genetic parameters
npm run evolve:genetic-params

# Validate evolved parameters
npm run validate:genetic-params
```

### Evolution Process

- **Population size:** 50 individuals
- **Generations:** 50 generations
- **Games per evaluation:** 100 games per individual
- **Evolution time:** ~42 minutes
- **Quality threshold:** Only saves parameters if they win >55% vs defaults

### Current Results

**Evolved Parameters Performance:**

- **Win rate vs defaults:** 61% (significant improvement)
- **Validation confirmed:** 1000-game test showed 69.4% win rate

## 🔧 Troubleshooting

### Common Issues

**GPU Not Found:**

```bash
# Check if PyTorch can see your GPU
python3 -c "import torch; print(torch.cuda.is_available())"
python3 -c "import torch; print(torch.backends.mps.is_available())"
```

**Training Too Slow:**

```bash
# Use Rust backend for CPU-only training
npm run train:rust:quick

# Or reduce training parameters
./ml/scripts/train.sh --num-games 100 --epochs 10
```

**Out of Memory:**

```bash
# Reduce batch size
./ml/scripts/train.sh --batch-size 16

# Use smaller model
./ml/scripts/train.sh --preset quick
```

### Performance Tips

1. **Use GPU**: PyTorch training is 10-50x faster with GPU
2. **Apple Silicon**: Native Metal backend provides excellent performance
3. **Batch Size**: Larger batch sizes are faster but use more memory
4. **Games vs Epochs**: More games generally better than more epochs

## 📚 Further Reading

See [AI-SYSTEM.md](../docs/AI-SYSTEM.md) for detailed usage instructions and technical details about the AI system.
