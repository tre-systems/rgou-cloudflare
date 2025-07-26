#!/bin/bash

# Weight loading script for Royal Game of Ur ML AI
# Wrapper for the unified weight conversion utility

set -e

echo "🔄 ML Weight Loading Script"
echo "==========================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3.8+"
    exit 1
fi

# Check if the conversion script exists
if [ ! -f "ml/scripts/convert_weights.py" ]; then
    echo "❌ Weight conversion script not found: ml/scripts/convert_weights.py"
    exit 1
fi

# Function to show usage
show_usage() {
    echo "Usage: $0 <weights-file> [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --format {unified|pytorch|rust}  Output format (default: unified)"
    echo "  --validate                       Validate weights"
    echo "  --copy-to-public                 Copy weights to public directory"
    echo "  --public-name NAME               Name for public weights file"
    echo "  --output FILE                    Output file name"
    echo "  --help                           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 ml/data/weights/my_weights.json --validate"
    echo "  $0 ml/data/weights/my_weights.json --copy-to-public"
    echo "  $0 ml/data/weights/my_weights.json --format rust --output rust_weights.json"
}

# Check if input file is provided
if [ $# -eq 0 ]; then
    echo "❌ No input file specified"
    show_usage
    exit 1
fi

# Check for help flag
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_usage
    exit 0
fi

echo "🎯 Converting weights..."
echo ""

# Run conversion with all arguments
python3 ml/scripts/convert_weights.py "$@"

echo ""
echo "✅ Weight loading completed!" 