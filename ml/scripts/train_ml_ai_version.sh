#!/bin/bash

# Parameterized ML AI Training Script
# Usage: ./train_ml_ai_version.sh [version] [options]

set -e

# Default values
VERSION="v3"
SKIP_BUILD=false
SKIP_TEST=false
SKIP_EVAL=false
REUSE_GAMES=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --version)
            VERSION="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-test)
            SKIP_TEST=true
            shift
            ;;
        --skip-eval)
            SKIP_EVAL=true
            shift
            ;;
        --reuse-games)
            REUSE_GAMES=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--version VERSION] [--skip-build] [--skip-test] [--skip-eval] [--reuse-games]"
            echo ""
            echo "Options:"
            echo "  --version VERSION    ML version to train (default: v3)"
            echo "  --skip-build         Skip building Rust AI core"
            echo "  --skip-test          Skip running tests after training"
            echo "  --skip-eval          Skip evaluation after training"
            echo "  --reuse-games        Reuse existing games from training_data_cache.json"
            echo "  --help               Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --version v2                    # Train ML-v2"
            echo "  $0 --version v3 --reuse-games      # Train ML-v3 reusing existing games"
            echo "  $0 --version v4 --skip-test        # Train ML-v4 without testing"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "=== ML AI Training for Version $VERSION ==="
echo "Skip build: $SKIP_BUILD"
echo "Skip test: $SKIP_TEST"
echo "Skip eval: $SKIP_EVAL"
echo "Reuse games: $REUSE_GAMES"
echo ""

# Build Rust AI core if not skipped
if [ "$SKIP_BUILD" = false ]; then
    echo "Building Rust AI core..."
    cd worker/rust_ai_core
    cargo build --release
    cd ../..
    echo "Rust AI core built successfully!"
    echo ""
fi

# Check if we're reusing games
REUSE_FLAG=""
if [ "$REUSE_GAMES" = true ]; then
    if [ -f "training_data_cache.json" ]; then
        echo "Found existing training data cache, will reuse games"
        REUSE_FLAG="--reuse-games"
    else
        echo "Warning: --reuse-games specified but training_data_cache.json not found"
        echo "Will generate new training data instead"
    fi
    echo ""
fi

# Run training
echo "Starting training for ML-$VERSION..."
echo "Command: python ml/scripts/train_ml_ai_version.py --version $VERSION $REUSE_FLAG"
echo ""

# Run the training script
python ml/scripts/train_ml_ai_version.py --version "$VERSION" $REUSE_FLAG

echo ""
echo "Training completed for ML-$VERSION!"

# Run tests if not skipped
if [ "$SKIP_TEST" = false ]; then
    echo ""
    echo "Running tests for ML-$VERSION..."
    cd worker/rust_ai_core
    cargo test "test_ml_${VERSION}_vs_expectiminimax_ai" -- --nocapture
    cd ../..
    echo "Tests completed!"
fi

# Run evaluation if not skipped
if [ "$SKIP_EVAL" = false ]; then
    echo ""
    echo "Running evaluation for ML-$VERSION..."
    npm run evaluate:ml -- --model "ml/data/weights/ml_ai_weights_${VERSION}.json" --num-games 100
    echo "Evaluation completed!"
fi

echo ""
echo "=== ML-$VERSION Training Complete ==="
echo "Weights saved to: ml/data/weights/ml_ai_weights_${VERSION}.json"
echo "Compressed weights: ml/data/weights/ml_ai_weights_${VERSION}.json.gz"
echo ""
echo "Next steps:"
echo "1. Load weights: npm run load:ml-weights ml/data/weights/ml_ai_weights_${VERSION}.json"
echo "2. Test in game: Start the game and select ML AI"
echo "3. Compare versions: npm run evaluate:ml -- --compare-versions" 