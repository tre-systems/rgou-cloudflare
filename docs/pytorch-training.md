# PyTorch Training System

_Comprehensive guide to the PyTorch-based training system with GPU acceleration and Rust data generation._

## Overview

The PyTorch training system provides **fast GPU-accelerated training** while leveraging the existing Rust code for data generation. This hybrid approach gives you the best of both worlds:

- **🚀 GPU Acceleration**: Automatic CUDA detection and utilization
- **🦀 Rust Data Generation**: Fast parallel game simulation using all CPU cores
- **⚡ Optimized Training**: PyTorch's highly optimized neural network operations
- **🔄 Seamless Integration**: Weights automatically compatible with Rust system

## Quick Start

### Prerequisites

1. **Python 3.8+** - For PyTorch training
2. **PyTorch** - Install with: `pip install -r requirements.txt`
3. **GPU Support** - CUDA (NVIDIA) or MPS (Apple Silicon) for acceleration
4. **Rust & Cargo** - For data generation
5. **wasm-pack** - For WASM builds: `cargo install wasm-pack --version 0.12.1 --locked`

### Installation

```bash
# Install PyTorch dependencies
pip install -r requirements.txt

# Verify installation
python3 -c "import torch; print('PyTorch version:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('MPS available:', torch.backends.mps.is_available() if hasattr(torch.backends, 'mps') else False)"
```

### Training Commands

```bash
# Quick test (100 games, 10 epochs)
npm run train:pytorch:test

# Standard training (1000 games, 50 epochs)
npm run train:pytorch

# Fast training (500 games, 25 epochs)
npm run train:pytorch:fast

# Production training (2000 games, 75 epochs)
npm run train:pytorch:production

# Custom training
./scripts/train-pytorch.sh 1500 60 0.001 64 4 custom_weights.json
```

## Architecture

### Data Flow

```
Rust Game Simulation → JSON Training Data → PyTorch DataLoader → GPU Training → JSON Weights → Rust Inference
```

### Key Components

- **`ml/scripts/train_pytorch.py`** - Main PyTorch training script
- **`ml/scripts/train-pytorch.sh`** - Shell wrapper with caffeinate
- **`ml/scripts/load_pytorch_weights.py`** - Weight conversion utility
- **Rust data generation** - Leverages existing `worker/rust_ai_core/src/bin/train.rs`
- **Training data directory** - `~/Desktop/rgou-training-data/` for all temporary files
- **Weights directory** - `ml/weights/` for all trained model weights

## Neural Network Architecture

### PyTorch Implementation

The PyTorch implementation uses the same architecture as Rust but with additional optimizations:

- **Input**: 150-dimensional feature vector
- **Hidden layers**: [256, 128, 64, 32] (ReLU activation + Dropout 0.1)
- **Value output**: 1 neuron (tanh activation)
- **Policy output**: 7 neurons (softmax activation)
- **Optimizer**: Adam with configurable learning rate
- **Loss functions**: MSE for value, CrossEntropy for policy
- **Total parameters**: ~81K (value) + ~82K (policy)

### Optimizations

- **Dropout layers** - Prevents overfitting
- **Adam optimizer** - Adaptive learning rate
- **GPU acceleration** - Automatic CUDA utilization
- **Batch processing** - Efficient parallel training
- **Early stopping** - Prevents overtraining

## Training Pipeline

### Phase 1: Rust Data Generation

- **Rust parallel processing** - Uses all CPU cores efficiently
- **Apple Silicon optimization** - Uses 8 performance cores on M1/M2/M3
- **Game simulation** - Generates training games with expectiminimax AI
- **Feature extraction** - Extracts features from each position
- **JSON export** - Saves training data to temporary file

### Phase 2: PyTorch Training

- **Data loading** - Converts JSON to PyTorch DataLoader
- **GPU acceleration** - Automatic CUDA detection and utilization
- **Batch processing** - Efficient parallel training with configurable batch size
- **Optimization** - Adam optimizer with adaptive learning rate
- **Regularization** - Dropout layers prevent overfitting
- **Early stopping** - Monitors validation loss to prevent overtraining
- **Progress tracking** - Real-time loss and ETA reporting

### Phase 3: Weight Export

- **Weight extraction** - Converts PyTorch tensors to JSON format
- **Compatibility** - Weights automatically compatible with Rust inference
- **Metadata** - Includes training parameters and performance metrics

## Performance

### Speed Comparison

| Aspect                 | PyTorch Training              | Rust Training           |
| ---------------------- | ----------------------------- | ----------------------- |
| **Training Speed**     | 🚀 **10-50x faster** (GPU)    | ⚡ Fast (CPU optimized) |
| **GPU Support**        | ✅ **Full CUDA acceleration** | ❌ CPU only             |
| **Memory Usage**       | 📊 Higher (GPU memory)        | 📊 Lower (CPU memory)   |
| **Dependencies**       | 🐍 Python + PyTorch           | 🦀 Pure Rust            |
| **Setup Complexity**   | 🔧 Moderate                   | 🔧 Simple               |
| **Cross-platform**     | ✅ Yes                        | ✅ Yes                  |
| **WASM Compatibility** | ✅ Via conversion             | ✅ Direct               |

### Performance Metrics

- **Data generation**: ~8,300 samples/second across 8 cores (Rust)
- **Training speed**: ~10-30 minutes for 50 epochs (1000 games) with GPU
- **GPU acceleration**: Automatic CUDA detection and utilization
- **Memory efficient**: Optimized for GPU memory usage
- **Batch processing**: Efficient parallel training with configurable batch size

### GPU Support

PyTorch training automatically detects and utilizes available GPUs:

- **CUDA**: Full acceleration on NVIDIA GPUs
- **MPS**: Apple Metal Performance Shaders on Apple Silicon
- **CPU fallback**: Automatic fallback when GPU unavailable

**Note**: GPU acceleration is required for meaningful performance improvement. Without GPU acceleration, PyTorch training will be slower than the Rust implementation.

## Usage Examples

### Basic Training

```bash
# Train with default parameters
./ml/scripts/train-pytorch.sh

# Train with custom parameters
./ml/scripts/train-pytorch.sh 1000 50 0.001 32 3 my_weights.json
```

### Weight Conversion

```bash
# Convert PyTorch weights to Rust format
python3 ml/scripts/load_pytorch_weights.py ml/weights/ml_ai_weights_pytorch_v1.json --test

# Convert with custom output file
python3 ml/scripts/load_pytorch_weights.py ml/weights/ml_ai_weights_pytorch_v1.json rust_weights.json
```

### Integration with Rust System

```bash
# Train with PyTorch
./ml/scripts/train-pytorch.sh 2000 75 0.001 32 4 ml_ai_weights_pytorch_v1.json

# Convert to Rust format
python3 ml/scripts/load_pytorch_weights.py ml/weights/ml_ai_weights_pytorch_v1.json

# Load into browser
npm run load:ml-weights ml/weights/ml_ai_weights_pytorch_v1_rust.json
```

## Configuration

### Training Parameters

| Parameter       | Default                      | Description                        |
| --------------- | ---------------------------- | ---------------------------------- |
| `num_games`     | 1000                         | Number of games to generate        |
| `epochs`        | 50                           | Number of training epochs          |
| `learning_rate` | 0.001                        | Learning rate for Adam optimizer   |
| `batch_size`    | 32                           | Batch size for training            |
| `depth`         | 3                            | Search depth for expectiminimax AI |
| `output_file`   | `ml_ai_weights_pytorch.json` | Output weights file                |

### Environment Variables

- `CUDA_VISIBLE_DEVICES` - Control which GPUs to use
- `PYTORCH_CUDA_ALLOC_CONF` - Configure CUDA memory allocation
- `OMP_NUM_THREADS` - Control CPU thread usage
- `PYTORCH_ENABLE_MPS_FALLBACK` - Enable MPS fallback to CPU

### Training Data Directory

All temporary files are stored in `~/Desktop/rgou-training-data/`:

- **`temp_config.json`** - Temporary configuration for Rust data generation
- **`temp_training_data.json`** - Generated training data from Rust
- **Training outputs** - Final weight files and logs

### Weights Directory

All trained model weights are stored in `ml/weights/`:

- **`ml_ai_weights_pytorch_v1.json`** - PyTorch-trained weights
- **`ml_ai_weights_pytorch_v1_rust.json`** - Converted Rust-compatible weights
- **`test_pytorch_weights.json`** - Test weights for validation

## Troubleshooting

### Common Issues

#### PyTorch Not Found

```bash
# Install PyTorch
pip install -r requirements.txt
```

#### CUDA Not Available

```bash
# Check GPU support
python3 -c "import torch; print('CUDA:', torch.cuda.is_available()); print('MPS:', torch.backends.mps.is_available() if hasattr(torch.backends, 'mps') else False)"

# Install CUDA version of PyTorch if needed
pip install torch --index-url https://download.pytorch.org/whl/cu118

# For Apple Silicon, ensure MPS is available
pip install torch
```

#### Rust Data Generation Fails

```bash
# Ensure Rust is installed
rustc --version

# Build Rust components
cd worker/rust_ai_core && cargo build --release
```

#### Memory Issues

```bash
# Reduce batch size
./scripts/train-pytorch.sh 1000 50 0.001 16 3

# Use CPU only
export CUDA_VISIBLE_DEVICES=""
```

### Performance Optimization

#### GPU Memory

```bash
# Monitor GPU usage
nvidia-smi

# Optimize batch size for your GPU
./scripts/train-pytorch.sh 1000 50 0.001 64 3  # Larger batch size
```

#### CPU Utilization

```bash
# Monitor CPU usage
htop

# Adjust Rust thread count
export RAYON_NUM_THREADS=8
```

## Advanced Usage

### Custom Network Architecture

Modify `scripts/train_pytorch.py` to change the network architecture:

```python
class ValueNetwork(nn.Module):
    def __init__(self, input_size: int = 150, hidden_sizes: List[int] = None):
        super().__init__()
        if hidden_sizes is None:
            hidden_sizes = [512, 256, 128, 64]  # Custom architecture

        # ... rest of implementation
```

### Custom Loss Functions

```python
# In PyTorchTrainer.__init__
self.value_criterion = nn.HuberLoss()  # More robust than MSE
self.policy_criterion = nn.KLDivLoss()  # For policy distillation
```

### Learning Rate Scheduling

```python
# Add to PyTorchTrainer.__init__
self.value_scheduler = optim.lr_scheduler.StepLR(self.value_optimizer, step_size=30, gamma=0.1)
self.policy_scheduler = optim.lr_scheduler.StepLR(self.policy_optimizer, step_size=30, gamma=0.1)
```

## Integration with Existing System

### Loading Weights

PyTorch-trained weights are automatically compatible with the existing Rust system:

1. **Train with PyTorch** - Fast GPU-accelerated training
2. **Convert weights** - Use `load_pytorch_weights.py`
3. **Load in browser** - Use existing `load:ml-weights` script

### Comparison with Rust Training

| Use Case                | Recommended System            |
| ----------------------- | ----------------------------- |
| **Fast iteration**      | PyTorch (GPU acceleration)    |
| **Production training** | PyTorch (better optimization) |
| **No dependencies**     | Rust (pure implementation)    |
| **Cross-platform**      | Both (PyTorch has edge)       |

## Future Enhancements

### Planned Features

- **Mixed precision training** - FP16 for faster training
- **Distributed training** - Multi-GPU support
- **Model checkpointing** - Resume interrupted training
- **Hyperparameter optimization** - Automated tuning
- **TensorBoard integration** - Advanced monitoring

### Potential Improvements

- **Custom CUDA kernels** - Optimized operations
- **Quantization** - Smaller model sizes
- **Knowledge distillation** - Transfer learning
- **Ensemble methods** - Multiple model combination

## Conclusion

The PyTorch training system provides a significant speed improvement over the Rust-only approach while maintaining full compatibility with the existing system. It's the recommended approach for most training scenarios, especially when GPU acceleration is available.

For maximum performance, use PyTorch training with GPU acceleration. For maximum compatibility and simplicity, use the Rust training system.
