#!/bin/bash

# Unified ML training script for Royal Game of Ur
# Replaces multiple training scripts with a single, clear interface

set -e

echo "🚀 Unified ML Training Script"
echo "=============================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3.8+"
    exit 1
fi

# Check if the unified training script exists
if [ ! -f "ml/scripts/train.py" ]; then
    echo "❌ Unified training script not found: ml/scripts/train.py"
    exit 1
fi

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --backend {auto|rust|pytorch}  Training backend (default: auto)"
    echo "  --preset {default|quick|production}  Training preset (default: default)"
    echo "  --output FILE                  Output file name"
    echo "  --num-games N                  Number of games to generate"
    echo "  --epochs N                     Number of training epochs"
    echo "  --learning-rate FLOAT          Learning rate"
    echo "  --batch-size N                 Batch size"
    echo "  --depth N                      Search depth"
    echo "  --help                         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --preset quick              # Quick test training"
    echo "  $0 --backend pytorch --preset production  # Production PyTorch training"
    echo "  $0 --backend rust --num-games 500 --epochs 25  # Custom Rust training"
    echo ""
    echo "Presets:"
    echo "  default:    1000 games, 50 epochs, 32 batch size"
    echo "  quick:      100 games, 10 epochs, 32 batch size"
    echo "  production: 2000 games, 100 epochs, 64 batch size"
}

# Parse command line arguments
BACKEND="auto"
PRESET="default"
OUTPUT=""
NUM_GAMES=""
EPOCHS=""
LEARNING_RATE=""
BATCH_SIZE=""
DEPTH=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend)
            BACKEND="$2"
            shift 2
            ;;
        --preset)
            PRESET="$2"
            shift 2
            ;;
        --output)
            OUTPUT="$2"
            shift 2
            ;;
        --num-games)
            NUM_GAMES="$2"
            shift 2
            ;;
        --epochs)
            EPOCHS="$2"
            shift 2
            ;;
        --learning-rate)
            LEARNING_RATE="$2"
            shift 2
            ;;
        --batch-size)
            BATCH_SIZE="$2"
            shift 2
            ;;
        --depth)
            DEPTH="$2"
            shift 2
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Build command
CMD="python3 ml/scripts/train.py --backend $BACKEND --preset $PRESET"

if [ -n "$OUTPUT" ]; then
    CMD="$CMD --output $OUTPUT"
fi

if [ -n "$NUM_GAMES" ]; then
    CMD="$CMD --num-games $NUM_GAMES"
fi

if [ -n "$EPOCHS" ]; then
    CMD="$CMD --epochs $EPOCHS"
fi

if [ -n "$LEARNING_RATE" ]; then
    CMD="$CMD --learning-rate $LEARNING_RATE"
fi

if [ -n "$BATCH_SIZE" ]; then
    CMD="$CMD --batch-size $BATCH_SIZE"
fi

if [ -n "$DEPTH" ]; then
    CMD="$CMD --depth $DEPTH"
fi

echo "🎯 Training Configuration:"
echo "  Backend: $BACKEND"
echo "  Preset: $PRESET"
if [ -n "$OUTPUT" ]; then echo "  Output: $OUTPUT"; fi
if [ -n "$NUM_GAMES" ]; then echo "  Games: $NUM_GAMES"; fi
if [ -n "$EPOCHS" ]; then echo "  Epochs: $EPOCHS"; fi
if [ -n "$LEARNING_RATE" ]; then echo "  Learning Rate: $LEARNING_RATE"; fi
if [ -n "$BATCH_SIZE" ]; then echo "  Batch Size: $BATCH_SIZE"; fi
if [ -n "$DEPTH" ]; then echo "  Depth: $DEPTH"; fi
echo ""

# Check for GPU acceleration if using PyTorch
if [ "$BACKEND" = "auto" ] || [ "$BACKEND" = "pytorch" ]; then
    echo "🔍 Checking for GPU acceleration..."
    if python3 -c "import torch; print('CUDA:', torch.cuda.is_available()); print('MPS:', torch.backends.mps.is_available() if hasattr(torch.backends, 'mps') else False)" 2>/dev/null | grep -q "True"; then
        if python3 -c "import torch; print(torch.cuda.is_available())" 2>/dev/null | grep -q "True"; then
            echo "🎮 CUDA detected - GPU acceleration will be used!"
        else
            echo "🍎 Apple Metal (MPS) detected - GPU acceleration will be used!"
        fi
    else
        echo "❌ No GPU acceleration available!"
        echo "   PyTorch training requires GPU acceleration (CUDA or MPS)"
        echo "   Please use Rust backend instead: --backend rust"
        exit 1
    fi
    echo ""
fi

# Run training with caffeinate to prevent sleep
echo "🚀 Starting training..."
caffeinate -i $CMD

echo ""
echo "✅ Training completed!" 