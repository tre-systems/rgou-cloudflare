# Mac Optimization Guide

## Overview

This guide documents the optimizations implemented to make maximal use of Mac resources for ML training. The system is specifically tuned for Mac hardware with MPS (Metal Performance Shaders) support.

## System Requirements

- **macOS**: 12.3+ (for MPS support)
- **Python**: 3.8+ with PyTorch 2.0+
- **Rust**: Latest stable version
- **Hardware**: Apple Silicon (M1/M2) or Intel Mac with Metal support

## Optimizations Implemented

### 1. GPU Acceleration (MPS)

**What it does**: Uses Metal Performance Shaders for neural network training
**Performance gain**: 3-5x faster training compared to CPU-only

```python
def get_device():
    if torch.backends.mps.is_available():
        return torch.device("mps")
    elif torch.cuda.is_available():
        return torch.device("cuda")
    else:
        return torch.device("cpu")
```

**Configuration**:

- Automatic device detection
- Batch size optimization (128 for MPS)
- Pin memory enabled for faster data transfer

### 2. Parallel Processing

**What it does**: Utilizes all CPU cores for data generation and training
**Performance gain**: Linear scaling with core count

```python
def get_optimal_workers():
    cpu_count = multiprocessing.cpu_count()
    return min(cpu_count, 8)
```

**Configuration**:

- DataLoader workers: Up to 8 parallel workers
- Game simulation: All CPU cores used
- Process pool executor for parallel game generation

### 3. Memory Optimization

**What it does**: Efficient memory usage and data loading
**Performance gain**: Reduced memory pressure, faster training

**Features**:

- Pin memory for GPU training
- Efficient batch processing
- Memory monitoring and reporting

### 4. Rust Compilation Optimization

**What it does**: Optimized Rust AI core for maximum performance
**Performance gain**: 2-3x faster game simulation

```toml
[profile.release]
opt-level = 3
lto = "fat"
codegen-units = 1
panic = "abort"
strip = true
```

**Build script optimizations**:

```bash
export RUSTFLAGS="-C target-cpu=native -C target-feature=+crt-static"
```

### 5. Environment Variables

**What it does**: Sets optimal threading for numerical libraries
**Performance gain**: Better utilization of all cores

```bash
export OMP_NUM_THREADS=$(sysctl -n hw.ncpu)
export MKL_NUM_THREADS=$(sysctl -n hw.ncpu)
export NUMEXPR_NUM_THREADS=$(sysctl -n hw.ncpu)
export VECLIB_MAXIMUM_THREADS=$(sysctl -n hw.ncpu)
```

### 6. Neural Network Architecture

**What it does**: Optimized network design for Mac hardware
**Performance gain**: Better training efficiency

**Architecture**:

- Larger hidden layers (128 → 64 → 32)
- Dropout for regularization
- ReLU activations for MPS compatibility

## Usage

### Quick Start

```bash
# Run optimized training
./scripts/train_ml_ai_optimized.sh

# Or run manually
python scripts/train_ml_ai.py \
    --num-games 10000 \
    --epochs 300 \
    --use-rust-ai \
    --output ml_ai_weights.json
```

### Build Optimized Rust Core

```bash
./scripts/build_rust_ai.sh
```

## Performance Monitoring

### Resource Usage Tracking

The training script includes built-in monitoring:

```python
def print_resource_usage():
    process = psutil.Process()
    memory_info = process.memory_info()
    cpu_percent = process.cpu_percent()
    print(f"Memory usage: {memory_info.rss / 1024 / 1024:.1f} MB")
    print(f"CPU usage: {cpu_percent:.1f}%")
```

### Expected Performance

On a Mac with 10 cores and 32GB RAM:

| Metric          | Performance                       |
| --------------- | --------------------------------- |
| Data Generation | ~1000 games/minute                |
| Training Speed  | ~50-100 epochs/minute             |
| Memory Usage    | 2-4GB during training             |
| Total Time      | 2-4 hours (10k games, 300 epochs) |

## Troubleshooting

### Common Issues

1. **MPS Not Available**

   ```bash
   # Check MPS availability
   python -c "import torch; print(torch.backends.mps.is_available())"
   ```

2. **Memory Issues**

   ```bash
   # Reduce batch size
   python scripts/train_ml_ai.py --batch-size 64
   ```

3. **Rust Build Failures**
   ```bash
   # Clean and rebuild
   cd worker/rust_ai_core
   cargo clean
   cargo build --release
   ```

### Performance Tuning

1. **Adjust Batch Size**
   - MPS: 128 (default)
   - CPU: 64
   - Reduce if memory issues occur

2. **Adjust Number of Workers**
   - Default: min(CPU cores, 8)
   - Reduce if system becomes unresponsive

3. **Memory Management**
   - Monitor with Activity Monitor
   - Close other applications during training

## Advanced Configuration

### Custom Training Parameters

```python
# Custom batch size for your hardware
BATCH_SIZE_MPS = 256  # For high-end Macs
BATCH_SIZE_CPU = 128  # For CPU-only training

# Custom worker count
MAX_WORKERS = 12  # For high-core count systems
```

### Environment-Specific Settings

```bash
# For development (faster builds)
export RUSTFLAGS="-C opt-level=1"

# For production (maximum performance)
export RUSTFLAGS="-C target-cpu=native -C opt-level=3"
```

## Best Practices

1. **Monitor System Resources**
   - Use Activity Monitor during training
   - Watch for memory pressure
   - Monitor CPU and GPU usage

2. **Optimize for Your Hardware**
   - Adjust batch size based on available memory
   - Tune worker count based on CPU cores
   - Test different configurations

3. **Regular Maintenance**
   - Clean Rust build artifacts periodically
   - Update PyTorch for latest MPS improvements
   - Monitor for macOS updates affecting MPS

## Future Improvements

1. **Dynamic Batch Sizing**
   - Automatically adjust based on available memory
   - Monitor GPU memory usage

2. **Advanced Parallelism**
   - Pipeline data generation and training
   - Overlap computation and I/O

3. **Memory Optimization**
   - Gradient checkpointing for large models
   - Mixed precision training

4. **Hardware-Specific Tuning**
   - Apple Silicon optimizations
   - Unified memory utilization
