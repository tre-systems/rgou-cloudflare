#!/bin/bash

echo "Running ML AI vs Deterministic AI comparison test..."
echo "This will run 100 games to compare the two AI systems."
echo ""

cd worker/rust_ai_core

# Run the test with detailed output
cargo test test_ml_vs_deterministic_ai -- --nocapture

echo ""
echo "Test completed!"
