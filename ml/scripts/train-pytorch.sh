#!/bin/bash

# PyTorch-based training script for Royal Game of Ur ML AI
# This script ensures optimal core utilization and prevents sleep during training

set -e

echo "🚀 Starting PyTorch ML AI Training with optimal core utilization..."

# Check if PyTorch is available
if ! python3 -c "import torch" 2>/dev/null; then
    echo "❌ PyTorch not found. Please install PyTorch first:"
    echo "   pip install -r requirements.txt"
    echo "   or"
    echo "   pip install torch"
    exit 1
fi

# Check for GPU acceleration
echo "🔍 Checking for GPU acceleration..."
if python3 -c "import torch; print('CUDA:', torch.cuda.is_available()); print('MPS:', torch.backends.mps.is_available() if hasattr(torch.backends, 'mps') else False)" 2>/dev/null | grep -q "True"; then
    if python3 -c "import torch; print(torch.cuda.is_available())" 2>/dev/null | grep -q "True"; then
        echo "🎮 CUDA detected - GPU acceleration will be used!"
    else
        echo "🍎 Apple Metal (MPS) detected - GPU acceleration will be used!"
    fi
else
    echo "⚠️  No GPU acceleration available - training will be slow!"
    echo "   Consider installing CUDA or using a machine with GPU support"
fi

# Default parameters
NUM_GAMES=${1:-1000}
EPOCHS=${2:-50}
LEARNING_RATE=${3:-0.001}
BATCH_SIZE=${4:-32}
DEPTH=${5:-3}
OUTPUT_FILE=${6:-"ml_ai_weights_pytorch.json"}

echo "📊 Training Parameters:"
echo "  Games: $NUM_GAMES"
echo "  Epochs: $EPOCHS"
echo "  Learning Rate: $LEARNING_RATE"
echo "  Batch Size: $BATCH_SIZE"
echo "  Search Depth: $DEPTH"
echo "  Output: $OUTPUT_FILE"
echo ""

# Run training with caffeinate to prevent sleep
cd "$(dirname "$0")/../.."
caffeinate -i python3 ml/scripts/train_pytorch.py "$NUM_GAMES" "$EPOCHS" "$LEARNING_RATE" "$BATCH_SIZE" "$DEPTH" "$OUTPUT_FILE"

echo "✅ PyTorch training complete!"
echo "📁 Weights saved to: $OUTPUT_FILE" 