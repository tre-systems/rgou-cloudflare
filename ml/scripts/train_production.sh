#!/bin/bash

# Production training script for large-scale ML AI training
# Uses the optimized hybrid Rust+Python approach

set -e

# Configuration
NUM_GAMES=${1:-5000}
EPOCHS=${2:-100}
DEPTH=${3:-3}
OUTPUT_FILE=${4:-"ml_ai_weights_production.json"}

echo "=== Production ML AI Training ==="
echo "Date: $(date)"
echo "Configuration:"
echo "  - Games: $NUM_GAMES"
echo "  - Epochs: $EPOCHS"
echo "  - Depth: $DEPTH"
echo "  - Output: $OUTPUT_FILE"
echo "  - CPU cores: $(nproc)"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Must run from project root directory"
    exit 1
fi

# Check dependencies
print_status "Checking dependencies..."

if ! command -v cargo &> /dev/null; then
    print_error "Rust/cargo not found"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    print_error "Python3 not found"
    exit 1
fi

# Check Python packages
python3 -c "import torch, numpy, tqdm" 2>/dev/null || {
    print_error "Missing Python packages. Install with: pip install torch numpy tqdm"
    exit 1
}

print_success "All dependencies available"

# Build Rust components
print_status "Building Rust AI core..."
cd worker/rust_ai_core
cargo build --release
cd ../..

if [ $? -ne 0 ]; then
    print_error "Rust build failed"
    exit 1
fi

print_success "Rust build completed"

# Setup training directory
TRAINING_DIR="$HOME/Desktop/rgou-training-data"
mkdir -p "$TRAINING_DIR"/{data,weights,logs,temp}

print_status "Training data directory: $TRAINING_DIR"

# Start training with caffeinate to prevent sleep
print_status "Starting production training..."
print_warning "This may take several hours. The system will not sleep during training."

START_TIME=$(date +%s)

# Use caffeinate to prevent system sleep during long training
caffeinate -i python3 ml/scripts/train_hybrid.py \
    --num-games "$NUM_GAMES" \
    --epochs "$EPOCHS" \
    --depth "$DEPTH" \
    --output "$OUTPUT_FILE" \
    --verbose

END_TIME=$(date +%s)
TRAINING_DURATION=$((END_TIME - START_TIME))

# Convert duration to hours, minutes, seconds
HOURS=$((TRAINING_DURATION / 3600))
MINUTES=$(((TRAINING_DURATION % 3600) / 60))
SECONDS=$((TRAINING_DURATION % 60))

print_success "=== Training Complete ==="
print_status "Total training time: ${HOURS}h ${MINUTES}m ${SECONDS}s"
print_status "Training data directory: $TRAINING_DIR"

# Check results
if [ -f "$TRAINING_DIR/weights/$OUTPUT_FILE" ]; then
    print_success "Weights file created successfully"
    WEIGHT_SIZE=$(du -h "$TRAINING_DIR/weights/$OUTPUT_FILE" | cut -f1)
    print_status "Weights file size: $WEIGHT_SIZE"
    
    # Show training statistics
    echo ""
    print_status "=== Training Statistics ==="
    echo "Generated files:"
    echo "  - Weights: $(find "$TRAINING_DIR/weights" -name "*.json" | wc -l) files"
    echo "  - Data: $(find "$TRAINING_DIR/data" -name "*.json" | wc -l) files"
    echo "  - Logs: $(find "$TRAINING_DIR/logs" -name "*.log" | wc -l) files"
    
    # Show latest log summary
    LATEST_LOG=$(find "$TRAINING_DIR/logs" -name "*.log" -exec ls -t {} + | head -1)
    if [ -n "$LATEST_LOG" ]; then
        echo ""
        print_status "Latest training log: $LATEST_LOG"
        echo "Key metrics:"
        grep -E "(Generation time|Training time|Generated.*samples|Best validation loss)" "$LATEST_LOG" | tail -3
    fi
    
    print_success "Production training completed successfully!"
    print_status "Next steps:"
    echo "  1. Test the new weights: npm run check"
    echo "  2. Compare with previous models"
    echo "  3. Deploy if performance is improved"
    
else
    print_error "Training failed - weights file not found"
    exit 1
fi 