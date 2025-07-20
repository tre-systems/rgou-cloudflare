# ML Training System

Optimized hybrid Rust+Python machine learning training system for the Royal Game of Ur AI.

## 🚀 Quick Start

```bash
# Test the system
./ml/scripts/test_optimized_training.sh

# Production training (5000 games, 100 epochs)
./ml/scripts/train_production.sh 5000 100 3 ml_ai_weights_v2.json

# Custom training
python ml/scripts/train_hybrid.py --num-games 1000 --epochs 50 --depth 3 --verbose
```

## 📁 Files

- **`train_hybrid.py`** - Main hybrid training script (Rust data generation + Python GPU training)
- **`train_production.sh`** - Production training script with caffeinate
- **`test_optimized_training.sh`** - Comprehensive test script
- **`load-ml-weights.ts`** - TypeScript utility for loading trained weights

## 🎯 Features

- **🦀 Rust Data Generation**: Fast parallel game simulation using all CPU cores
- **🔥 Python GPU Training**: Efficient neural network training with PyTorch
- **⚡ Maximum CPU Utilization**: Uses all available cores for data generation
- **📊 Comprehensive Logging**: Detailed logs saved to `~/Desktop/rgou-training-data/logs/`
- **📁 Organized Storage**: Training data and weights stored in `~/Desktop/rgou-training-data/`

## 🏗️ Architecture

1. **Phase 1**: Rust generates training data using parallel processing
2. **Phase 2**: Python trains neural networks using GPU acceleration
3. **Phase 3**: Save trained weights in the expected format

## 📊 Performance

- **Eliminated subprocess bottleneck** that was causing slow processing
- **Parallel data generation** using rayon across all CPU cores
- **Batch processing** for efficient GPU training
- **Early stopping** to prevent overfitting

## 📁 Output Structure

```
~/Desktop/rgou-training-data/
├── data/          # Generated training data
├── weights/       # Trained model weights
├── logs/          # Training logs
└── temp/          # Temporary files (auto-cleaned)
```

## 🔧 Requirements

- **Rust & Cargo** - For data generation
- **Python 3.10+** - For neural network training
- **PyTorch** - For GPU training
- **NumPy, tqdm** - For data processing

## 🎮 Usage Examples

### Quick Test

```bash
./ml/scripts/test_optimized_training.sh
```

### Small Training Run

```bash
python ml/scripts/train_hybrid.py --num-games 100 --epochs 10 --depth 3 --verbose
```

### Production Training

```bash
./ml/scripts/train_production.sh 5000 100 3 ml_ai_weights_v2.json
```

### Custom Configuration

```bash
python ml/scripts/train_hybrid.py \
  --num-games 2000 \
  --epochs 75 \
  --depth 4 \
  --learning-rate 0.0005 \
  --batch-size 64 \
  --output "my_custom_weights.json" \
  --verbose
```

## 📈 Monitoring

All training runs include comprehensive logging:

- Real-time progress updates
- Performance metrics (time per game, samples per second)
- CPU and GPU utilization
- Training and validation loss curves
- Early stopping notifications

Logs are saved to `~/Desktop/rgou-training-data/logs/` with timestamps.
