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
├── data/                        # Training data and configuration
│   ├── training/               # Training datasets
│   ├── genetic_params/         # Genetic algorithm parameters
│   └── weights/                # Legacy weights (moved to parent)
└── data/weights/                # All trained model weights
```

## Quick Start Commands

### PyTorch Training

```bash
# Install PyTorch dependencies
pip install -r requirements.txt

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
python3 ml/scripts/load_pytorch_weights.py ml/data/weights/ml_ai_weights_v1.json --test

# Load weights for browser use
npm run load:ml-weights ml/data/weights/ml_ai_weights_v1_rust.json
```

## Model Performance Matrix

### Against Expectiminimax AI (100 games each)

| Model          | Win Rate vs Depth 3 | Win Rate vs Depth 4 | Avg Moves | Performance Rating |
| -------------- | ------------------- | ------------------- | --------- | ------------------ |
| **PyTorch V5** | **49.0%**           | **44.0%**           | **166.6** | **⭐⭐⭐⭐⭐**     |
| V2             | 40.0%               | N/A                 | 150.3     | ⭐⭐⭐             |
| V4             | 20.0%               | N/A                 | 148.1     | ⭐⭐               |
| Fast           | N/A                 | N/A                 | N/A       | ⭐⭐⭐             |

### Inter-Model Comparison (20 games each)

| Model 1 | Model 2    | Win Rate 1 | Avg Moves | Winner     |
| ------- | ---------- | ---------- | --------- | ---------- |
| Fast    | V2         | 65.0%      | 158.8     | Fast       |
| Fast    | V4         | 55.0%      | 144.5     | Fast       |
| Fast    | PyTorch V5 | 45.0%      | 149.2     | PyTorch V5 |
| V2      | V4         | 40.0%      | 141.2     | V4         |
| V2      | PyTorch V5 | 50.0%      | 153.9     | Tie        |
| V4      | PyTorch V5 | 20.0%      | 150.1     | PyTorch V5 |

### Overall Model Rankings

1. **PyTorch V5**: 61.7% average win rate ⭐⭐⭐⭐⭐
2. **Fast**: 55.0% average win rate ⭐⭐⭐⭐
3. **V2**: 41.7% average win rate ⭐⭐⭐
4. **V4**: 41.7% average win rate ⭐⭐⭐

### Detailed Analysis

#### PyTorch V5 (Best Performer)

- **Training**: 2000 epochs, 100 games per epoch, learning rate 0.001, batch size 64
- **Architecture**: Improved neural network with better feature engineering
- **Performance**:
  - 49.0% win rate against expectiminimax AI (Depth 3)
  - **44.0% win rate against expectiminimax AI (Depth 4)** - **Competitive with strongest classic AI!**
  - 61.7% average win rate against other ML models
  - 0.7ms average move time (8.1x faster than Depth 4)
  - Performs better when playing second (60% vs 38% when playing first)
  - **First ML model to compete with Depth 4 expectiminimax**

#### Fast Model

- **Training**: Quick training for rapid iteration
- **Performance**: Strong against other ML models but not tested against expectiminimax
- **Use Case**: Good for development and testing

#### V2 Model

- **Performance**: 40.0% win rate against expectiminimax AI
- **Characteristics**: Balanced performance, moderate strength
- **Use Case**: Baseline comparison model

#### V4 Model

- **Performance**: 20.0% win rate against expectiminimax AI
- **Characteristics**: Weakest performer, needs improvement
- **Use Case**: Example of what not to do in training

### Recommendations

#### For Production Use

✅ **PyTorch V5** is ready for production use

- Clear winner in all comparisons
- Competitive against expectiminimax AI
- Fast inference time (0.7ms per move)

#### For Development

✅ **Fast** model is good for rapid iteration

- Quick to train and test
- Good performance against other ML models

#### For Further Improvement

⚠️ Consider retraining V2 and V4 models

- Both show room for improvement
- Could benefit from PyTorch V5's training approach

### Test Methodology

#### Expectiminimax AI Tests

- 100 games per model (Depth 3), 50 games per model (Depth 4)
- Alternating first/second player
- Depth 3 and Depth 4 expectiminimax search
- Random dice rolls

#### Inter-Model Tests

- 20 games per comparison
- Alternating first/second player
- Same ML AI architecture
- Random dice rolls

#### Performance Metrics

- Win rate percentage
- Average moves per game
- Average time per move
- First vs second player performance

### Next Steps

1. **Deploy PyTorch V5** as the primary ML AI - **Ready for production!**
2. **Archive older models** (V2, V4) for reference
3. **Continue training** with self-play reinforcement learning
4. **Experiment with** Monte Carlo Tree Search integration
5. **Optimize** neural network architecture further
6. **Test against Depth 4** - PyTorch V5 shows competitive performance!

### Technical Notes

- All tests run on Apple Silicon (M1/M2) hardware
- PyTorch training used GPU acceleration via MPS
- Rust implementation for fast inference
- Consistent random seed for reproducible results

## Performance Comparison

| Aspect                 | PyTorch Training                  | Rust Training           |
| ---------------------- | --------------------------------- | ----------------------- |
| **Training Speed**     | 🚀 **10-50x faster** (GPU)        | ⚡ Fast (CPU optimized) |
| **GPU Support**        | ✅ **Full CUDA/MPS acceleration** | ❌ CPU only             |
| **Memory Usage**       | 📊 Higher (GPU memory)            | 📊 Lower (CPU memory)   |
| **Dependencies**       | 🐍 Python + PyTorch               | 🦀 Pure Rust            |
| **Setup Complexity**   | 🔧 Moderate                       | 🔧 Simple               |
| **Cross-platform**     | ✅ Yes                            | ✅ Yes                  |
| **WASM Compatibility** | ✅ Via conversion                 | ✅ Direct               |

## Neural Network Architecture

### Architecture Details

- **Input**: 150-dimensional feature vector
- **Hidden layers**: [256, 128, 64, 32] (ReLU activation + Dropout 0.1)
- **Value output**: 1 neuron (tanh activation)
- **Policy output**: 7 neurons (softmax activation)
- **Optimizer**: Adam with configurable learning rate
- **Loss functions**: MSE for value, CrossEntropy for policy
- **Total parameters**: ~81K (value) + ~82K (policy)

### Feature Engineering

The 150 features include:

- **28 features**: Piece positions (14 per player)
- **21 features**: Board occupancy
- **20+ features**: Strategic metrics (rosette control, safety scores, etc.)
- **1 feature**: Current player
- **1 feature**: Dice roll
- **1 feature**: Valid moves count
- **Plus many advanced strategic features**

## Training Pipeline

### PyTorch Training System

The PyTorch training system uses a **hybrid approach**:

1. **Rust Data Generation** - Fast parallel game simulation using all CPU cores
2. **PyTorch Training** - GPU-accelerated neural network training with optimized operations

#### Data Flow

```
Rust Game Simulation → JSON Training Data → PyTorch DataLoader → GPU Training → JSON Weights → Rust Inference
```

#### Key Components

- **`ml/scripts/train_pytorch.py`** - Main PyTorch training script
- **`ml/scripts/train-pytorch.sh`** - Shell wrapper with caffeinate
- **`ml/scripts/load_pytorch_weights.py`** - Weight conversion utility
- **Rust data generation** - Leverages existing `worker/rust_ai_core/src/bin/train.rs`
- **Training data directory** - `~/Desktop/rgou-training-data/` for all temporary files
- **Weights directory** - `ml/data/weights/` for all trained model weights

### Rust Training System

#### WASM vs Training Separation

The system uses **feature flags** to keep training code completely separate from the WASM bundle:

```toml
[features]
training = []
```

#### Size Comparison

| Build Type           | Size      | Training Code   |
| -------------------- | --------- | --------------- |
| **WASM (optimized)** | **223KB** | ✅ **Excluded** |
| **Training (full)**  | ~50MB     | ✅ **Included** |

**WASM size reduction: 99.85% smaller!**

## Prerequisites

### PyTorch Training

- **Python 3.8+** - For PyTorch training
- **PyTorch** - Install with: `pip install -r requirements.txt`
- **GPU Support** - CUDA (NVIDIA) or MPS (Apple Silicon) for acceleration
- **Rust & Cargo** - For data generation
- **wasm-pack** - For WASM builds: `cargo install wasm-pack --version 0.12.1 --locked`

### Rust Training

- **Rust & Cargo** - Latest stable version
- **wasm-pack** - For WASM builds: `cargo install wasm-pack --version 0.12.1 --locked`

## Advanced Features

### GPU Acceleration

PyTorch training automatically detects and uses:

- **CUDA** - NVIDIA GPUs
- **MPS** - Apple Silicon (M1/M2/M3)
- **CPU fallback** - If no GPU available

### Apple Silicon Optimization

Both training systems are optimized for Apple Silicon:

- **8 performance cores** - Used for parallel processing
- **MPS acceleration** - PyTorch uses Metal Performance Shaders
- **Caffeinate** - Prevents system sleep during training

### Training Optimizations

- **Dropout layers** - Prevents overfitting
- **Adam optimizer** - Adaptive learning rate
- **Batch processing** - Efficient parallel training
- **Early stopping** - Prevents overtraining
- **Validation split** - 20% for monitoring performance

## Model Performance

### Current Model Rankings

| Model      | Win Rate vs EMM-3 | Status                  |
| ---------- | ----------------- | ----------------------- |
| **v2**     | **44%**           | ✅ **Best Performance** |
| **Fast**   | 36%               | Competitive             |
| **v4**     | 32%               | ⚠️ Needs Improvement    |
| **Hybrid** | 30%               | ⚠️ Needs Improvement    |

### Training Time Estimates

| Configuration  | Games | Epochs | Batch Size | Estimated Time |
| -------------- | ----- | ------ | ---------- | -------------- |
| **Quick Test** | 100   | 10     | 32         | ~2 minutes     |
| **Standard**   | 1000  | 50     | 32         | ~10 minutes    |
| **Fast**       | 500   | 25     | 32         | ~5 minutes     |
| **Production** | 2000  | 75     | 32         | ~25 minutes    |
| **v5**         | 2000  | 100    | 64         | ~30 minutes    |

_Times are approximate and depend on hardware (GPU acceleration significantly reduces time)_

## Troubleshooting

### Common Issues

1. **GPU not detected** - Ensure PyTorch is installed with GPU support
2. **Memory issues** - Reduce batch size or number of games
3. **Training too slow** - Check if GPU acceleration is active
4. **WASM build failures** - Run `npm run build:wasm-assets`

### Performance Tips

- **Use GPU acceleration** - PyTorch training is 10-50x faster with GPU
- **Optimize batch size** - Larger batches are faster but use more memory
- **Monitor training** - Watch for overfitting with validation loss
- **Use caffeinate** - Prevents system sleep during long training runs

## Integration with Game

Trained models are automatically integrated into the game:

1. **Weight conversion** - PyTorch weights converted to Rust format
2. **WASM compilation** - Rust code compiled to WebAssembly
3. **Browser loading** - Weights loaded in browser for inference
4. **Real-time play** - AI responds in real-time during gameplay

See [AI System](./ai-system.md) for details on how the ML AI integrates with the game.
