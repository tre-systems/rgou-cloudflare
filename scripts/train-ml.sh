#!/bin/bash

# Training script for Royal Game of Ur ML AI
# This script ensures optimal core utilization on Apple Silicon

set -e

echo "🚀 Starting ML AI Training with optimal core utilization..."

# Set environment variables for optimal performance
export RUSTFLAGS="-C target-cpu=native"
export CARGO_PROFILE_RELEASE_OPT_LEVEL=3
export CARGO_PROFILE_RELEASE_LTO=true

# Default parameters
NUM_GAMES=${1:-1000}
EPOCHS=${2:-50}
LEARNING_RATE=${3:-0.001}
BATCH_SIZE=${4:-32}
DEPTH=${5:-3}
OUTPUT_FILE=${6:-"ml_ai_weights_rust.json"}

echo "📊 Training Parameters:"
echo "  Games: $NUM_GAMES"
echo "  Epochs: $EPOCHS"
echo "  Learning Rate: $LEARNING_RATE"
echo "  Batch Size: $BATCH_SIZE"
echo "  Search Depth: $DEPTH"
echo "  Output: $OUTPUT_FILE"
echo ""

# Run training with caffeinate to prevent sleep
cd worker/rust_ai_core
caffeinate -i cargo run --bin train --release --features training -- train "$NUM_GAMES" "$EPOCHS" "$LEARNING_RATE" "$BATCH_SIZE" "$DEPTH" "$OUTPUT_FILE"

echo "✅ Training complete!"
echo "📁 Weights saved to: $OUTPUT_FILE" 