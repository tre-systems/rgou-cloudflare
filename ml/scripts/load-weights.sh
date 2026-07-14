#!/bin/bash

# Weight loading script for Royal Game of Ur ML AI
# Wrapper for the unified weight conversion utility

set -e

echo "🔄 ML Weight Loading Script"
echo "==========================="

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo "❌ uv not found. Install it from https://docs.astral.sh/uv/"
    exit 1
fi

# Check if the model tools exist
if [ ! -f "ml/scripts/convert_weights.py" ] || [ ! -f "ml/scripts/model_provenance.py" ]; then
    echo "❌ Model tooling is incomplete under ml/scripts"
    exit 1
fi

# Function to show usage
show_usage() {
    echo "Usage: $0 [--promote [MODEL]]"
    echo "       $0 <weights-file> [CONVERSION OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --promote [MODEL]                 Promote an exact JSON + gzip pair"
    echo "  --format {unified|pytorch|rust}  Output format (default: unified)"
    echo "  --validate                       Validate weights"
    echo "  --output FILE                    Output file name"
    echo "  --help                           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                      # promote the configured production model"
    echo "  $0 --promote ml/data/weights/model.json # promote a selected model"
    echo "  $0 ml/data/weights/my_weights.json --validate"
    echo "  $0 ml/data/weights/my_weights.json --format rust --output rust_weights.json"
}

# Check for help flag
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    show_usage
    exit 0
fi

PYTHON="$(uv python find "$(cat ml/.python-version)")"

if [ $# -eq 0 ]; then
    "$PYTHON" ml/scripts/model_provenance.py promote
    exit 0
fi

if [ "$1" = "--promote" ]; then
    if [ $# -gt 2 ]; then
        echo "❌ --promote accepts at most one model path"
        exit 1
    fi
    if [ $# -eq 2 ]; then
        "$PYTHON" ml/scripts/model_provenance.py promote --model "$2"
    else
        "$PYTHON" ml/scripts/model_provenance.py promote
    fi
    exit 0
fi

echo "🎯 Converting weights..."
echo ""

# Run conversion with all arguments
"$PYTHON" ml/scripts/convert_weights.py "$@"

echo ""
echo "✅ Weight loading completed!"
