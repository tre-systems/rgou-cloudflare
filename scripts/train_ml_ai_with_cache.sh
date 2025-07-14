#!/bin/bash

echo "Starting ML AI training with data persistence..."
echo "This will use cached training data if available, or generate new data."
echo ""

cd /Users/robertgilks/Source/rgou-cloudflare

# Build the Rust AI core first
echo "Building Rust AI core..."
cd worker/rust_ai_core
cargo build --release
cd ../..

# Check if we have cached training data
if [ -f "training_data_cache.json" ]; then
    echo "Found cached training data. Using cached data for faster training..."
    # Use cached training data
    caffeinate -i python3 scripts/train_ml_ai.py \
        --num-games 3000 \
        --epochs 150 \
        --batch-size 256 \
        --learning-rate 0.001 \
        --use-rust-ai \
        --load-existing \
        --output ml_ai_weights_cached.json
else
    echo "No cached training data found. Generating fresh data..."
    # Generate training data with optimized parameters
    caffeinate -i python3 scripts/train_ml_ai.py \
        --num-games 3000 \
        --epochs 150 \
        --batch-size 256 \
        --learning-rate 0.001 \
        --use-rust-ai \
        --output ml_ai_weights_cached.json
fi

echo ""
echo "Training completed! New weights saved to ml_ai_weights_cached.json"
echo "Training data cached for future use in training_data_cache.json"
echo ""

# Test the new model
echo "Testing the new model against expectiminimax AI..."
./scripts/test_ml_vs_expectiminimax.sh

echo ""
echo "Training with cache complete!"
