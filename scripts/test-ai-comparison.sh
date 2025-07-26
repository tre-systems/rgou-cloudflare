#!/bin/bash

# AI Comparison Test Script
# This script runs comprehensive AI comparison tests using the new unified framework

set -e

echo "🤖 AI Comparison Test Suite"
echo "=========================="

# Configuration
NUM_GAMES=${NUM_GAMES:-10}
INCLUDE_SLOW_TESTS=${INCLUDE_SLOW_TESTS:-false}
OUTPUT_FILE=${OUTPUT_FILE:-"ai_comparison_results.json"}
RANDOM_SEED=${RANDOM_SEED:-42}

echo "Configuration:"
echo "  Games per match: $NUM_GAMES"
echo "  Include slow tests: $INCLUDE_SLOW_TESTS"
echo "  Output file: $OUTPUT_FILE"
echo "  Random seed: $RANDOM_SEED"
echo ""

# Function to run Rust tests
run_rust_tests() {
    echo "🔧 Running Rust AI comparison tests..."
    
    cd worker/rust_ai_core
    
    # Set environment variables
    export NUM_GAMES=$NUM_GAMES
    export RANDOM_SEED=$RANDOM_SEED
    
    if [ "$INCLUDE_SLOW_TESTS" = "true" ]; then
        export RUN_SLOW_TESTS=1
        echo "  Including slow tests (depth 4, etc.)"
        cargo test test_ai_matrix --features slow_tests -- --nocapture
    else
        echo "  Running fast tests only"
        cargo test test_ai_matrix -- --nocapture
    fi
    
    cd ../..
    echo "✅ Rust tests completed"
}

# Function to run TypeScript tests
run_typescript_tests() {
    echo "🔧 Running TypeScript AI comparison tests..."
    
    npm run test src/lib/__tests__/ai-comparison.test.ts -- --reporter=verbose
    
    echo "✅ TypeScript tests completed"
}

# Function to run basic functionality tests
run_basic_tests() {
    echo "🔧 Running basic AI functionality tests..."
    
    cd worker/rust_ai_core
    
    cargo test test_ai_matrix -- --nocapture
    
    cd ../..
    echo "✅ Basic tests completed"
}

# Function to run ML model loading tests
run_ml_tests() {
    echo "🔧 Running ML model loading tests..."
    
    cd worker/rust_ai_core
    
    # Run the matrix test which includes all ML models
    cargo test test_ai_matrix -- --nocapture
    
    cd ../..
    echo "✅ ML tests completed"
}

# Function to generate summary report
generate_report() {
    echo "📊 Generating AI comparison report..."
    
    if [ -f "$OUTPUT_FILE" ]; then
        echo "  Results saved to: $OUTPUT_FILE"
        
        # Check if jq is available for JSON formatting
        if command -v jq &> /dev/null; then
            echo ""
            echo "📈 Summary:"
            jq -r '.summary | "Best Performing: " + .best_performing_ai + "\nFastest: " + .fastest_ai + "\nMost Consistent: " + .most_consistent_ai' "$OUTPUT_FILE" 2>/dev/null || echo "  Could not parse summary from results file"
        fi
    else
        echo "  No results file found"
    fi
}

# Function to run performance benchmarks
run_performance_benchmarks() {
    echo "⚡ Running performance benchmarks..."
    
    cd worker/rust_ai_core
    
    # Run expectiminimax diagnostic tests
    cargo test test_expectiminimax_diagnostic -- --nocapture
    
    # Run genetic parameters comparison
    cargo test test_genetic_params_comparison -- --nocapture
    
    cd ../..
    echo "✅ Performance benchmarks completed"
}

# Function to run regression tests
run_regression_tests() {
    echo "🔄 Running regression tests..."
    
    cd worker/rust_ai_core
    
    # Run basic ML vs Expectiminimax test
    cargo test test_ml_vs_expectiminimax_ai -- --nocapture
    
    # Run ML consistency test
    cargo test test_ml_ai_consistency -- --nocapture
    
    cd ../..
    echo "✅ Regression tests completed"
}

# Main execution
main() {
    local test_type=${1:-"all"}
    
    case $test_type in
        "basic")
            run_basic_tests
            ;;
        "ml")
            run_ml_tests
            ;;
        "performance")
            run_performance_benchmarks
            ;;
        "regression")
            run_regression_tests
            ;;
        "typescript")
            run_typescript_tests
            ;;
        "rust")
            run_rust_tests
            ;;
        "all"|*)
            echo "Running all test suites..."
            run_basic_tests
            echo ""
            run_ml_tests
            echo ""
            run_performance_benchmarks
            echo ""
            run_regression_tests
            echo ""
            run_typescript_tests
            echo ""
            run_rust_tests
            echo ""
            generate_report
            ;;
    esac
    
    echo ""
    echo "🎉 AI comparison test suite completed!"
    echo ""
    echo "Next steps:"
    echo "  1. Review the test output above"
    echo "  2. Check the results file: $OUTPUT_FILE"
    echo "  3. Run 'npm run check' to verify everything works"
    echo "  4. Consider running with NUM_GAMES=100 for more comprehensive results"
}

# Handle command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [test_type]"
    echo ""
    echo "Test types:"
    echo "  all         - Run all test suites (default)"
    echo "  basic       - Run basic functionality tests"
    echo "  ml          - Run ML model loading tests"
    echo "  performance - Run performance benchmarks"
    echo "  regression  - Run regression tests"
    echo "  typescript  - Run TypeScript tests"
    echo "  rust        - Run Rust comprehensive tests"
    echo ""
    echo "Environment variables:"
    echo "  NUM_GAMES         - Number of games per match (default: 10)"
    echo "  INCLUDE_SLOW_TESTS - Include slow tests (default: false)"
    echo "  OUTPUT_FILE       - Results output file (default: ai_comparison_results.json)"
    echo "  RANDOM_SEED       - Random seed for reproducible results (default: 42)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests with default settings"
    echo "  NUM_GAMES=50 $0       # Run with 50 games per match"
    echo "  $0 performance        # Run only performance benchmarks"
    echo "  INCLUDE_SLOW_TESTS=true $0 rust  # Run comprehensive tests with slow tests"
    exit 0
fi

# Run the main function
main "$@" 