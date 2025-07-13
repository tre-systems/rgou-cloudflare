#!/bin/bash

echo "Starting optimized ML AI training..."
echo "This will generate high-quality training data and train a much stronger model."
echo ""

cd /Users/robertgilks/Source/rgou-cloudflare

# Build the Rust AI core first
echo "Building Rust AI core..."
cd worker/rust_ai_core
cargo build --release
cd ../..

# Generate high-quality training data
echo "Generating high-quality training data..."
python3 scripts/train_ml_ai.py \
    --num-games 5000 \
    --epochs 200 \
    --batch-size 128 \
    --learning-rate 0.0005 \
    --use-rust-ai \
    --output-file ml_ai_weights_optimized.json \
    --quantize \
    --compress

echo ""
echo "Training completed! New weights saved to ml_ai_weights_optimized.json"
echo ""

# Test the new model
echo "Testing the new model against deterministic AI..."
./scripts/test_ml_vs_deterministic.sh

echo ""
echo "Optimized training complete!"
