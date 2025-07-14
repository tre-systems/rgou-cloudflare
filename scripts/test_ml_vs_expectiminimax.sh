#!/bin/bash

echo "Running ML AI vs Expectiminimax AI comparison test..."
echo "This will run 100 games to compare the two AI systems."
echo ""

cd worker/rust_ai_core

# Run the test with detailed output
cargo test test_ml_vs_expectiminimax_ai -- --nocapture

echo ""
echo "Test completed!"
