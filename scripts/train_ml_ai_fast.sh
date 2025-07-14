#!/bin/bash

echo "Starting FAST ML AI training..."
echo "This will generate training data and train a strong model in ~2-3 hours."
echo ""

cd /Users/robertgilks/Source/rgou-cloudflare

# Build the Rust AI core first
echo "Building Rust AI core..."
cd worker/rust_ai_core
cargo build --release
cd ../..

# Check if we have cached training data
if [ -f "training_data_cache.json" ]; then
    echo "Found cached training data. Use --load-existing to reuse it."
    echo "Generating fresh training data..."
    # Generate training data with optimized parameters
    caffeinate -i python3 scripts/train_ml_ai.py \
        --num-games 3000 \
        --epochs 150 \
        --batch-size 256 \
        --learning-rate 0.001 \
        --use-rust-ai \
        --output ml_ai_weights_fast.json
else
    echo "No cached training data found. Generating fresh data..."
    # Generate training data with optimized parameters
    caffeinate -i python3 scripts/train_ml_ai.py \
        --num-games 3000 \
        --epochs 150 \
        --batch-size 256 \
        --learning-rate 0.001 \
        --use-rust-ai \
        --output ml_ai_weights_fast.json
fi

echo ""
echo "Training completed! New weights saved to ml_ai_weights_fast.json"
echo "Training data cached for future use in training_data_cache.json"
echo ""

# Test the new model
echo "Testing the new model against expectiminimax AI..."
./scripts/test_ml_vs_expectiminimax.sh

echo ""
echo "Fast training complete!"
