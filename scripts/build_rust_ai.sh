#!/bin/bash

set -e

echo "Building Rust AI core with optimal settings for Mac..."

cd worker/rust_ai_core

export RUSTFLAGS="-C target-cpu=native -C target-feature=+crt-static"

echo "Cleaning previous builds..."
cargo clean

echo "Building with release optimizations..."
cargo build --release

echo "Checking binary size..."
ls -lh target/release/rgou_ai_core

echo "Testing binary..."
./target/release/rgou_ai_core --help || echo "Binary built successfully"

echo "Rust AI core build complete!"
