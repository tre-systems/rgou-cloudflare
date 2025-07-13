#!/bin/bash

set -e

echo "=========================================="
echo "Royal Game of Ur ML AI Training - Optimized"
echo "=========================================="

echo "System Information:"
echo "CPU cores: $(sysctl -n hw.ncpu)"
echo "Memory: $(($(sysctl -n hw.memsize) / 1024 / 1024 / 1024)) GB"
echo "PyTorch MPS available: $(python -c "import torch; print(torch.backends.mps.is_available())")"

echo ""
echo "Building Rust AI core with optimal settings..."
./scripts/build_rust_ai.sh

echo ""
echo "Installing/updating Python dependencies..."
pip install -r requirements.txt

echo ""
echo "Setting optimal environment variables..."
export OMP_NUM_THREADS=$(sysctl -n hw.ncpu)
export MKL_NUM_THREADS=$(sysctl -n hw.ncpu)
export NUMEXPR_NUM_THREADS=$(sysctl -n hw.ncpu)
export VECLIB_MAXIMUM_THREADS=$(sysctl -n hw.ncpu)

echo "OMP_NUM_THREADS: $OMP_NUM_THREADS"
echo "MKL_NUM_THREADS: $MKL_NUM_THREADS"
echo "NUMEXPR_NUM_THREADS: $NUMEXPR_NUM_THREADS"
echo "VECLIB_MAXIMUM_THREADS: $VECLIB_MAXIMUM_THREADS"

echo ""
echo "Starting optimized training..."

python scripts/train_ml_ai.py \
    --num-games 10000 \
    --epochs 300 \
    --learning-rate 0.001 \
    --use-rust-ai \
    --output ml_ai_weights_optimized.json

echo ""
echo "Training complete!"
echo "Weights saved to: ml_ai_weights_optimized.json"
