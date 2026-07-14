#!/usr/bin/env bash

set -euo pipefail

NUM_GAMES=${NUM_GAMES:-10}
INCLUDE_SLOW_TESTS=${INCLUDE_SLOW_TESTS:-false}
CRATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../worker/rust_ai_core" && pwd)"

if [[ ${1:-} == '--help' || ${1:-} == '-h' ]]; then
  echo 'Usage: scripts/test-ai-comparison.sh'
  echo 'Environment: NUM_GAMES=10 INCLUDE_SLOW_TESTS=false'
  exit 0
fi

if [[ $# -gt 0 ]]; then
  echo 'This command runs the complete AI matrix; positional test-suite selectors are not supported.' >&2
  exit 2
fi

echo "Running AI matrix (${NUM_GAMES} games per matchup)"

cd "$CRATE_DIR"
if [[ "$INCLUDE_SLOW_TESTS" == 'true' ]]; then
  RUN_SLOW_TESTS=1 NUM_GAMES="$NUM_GAMES" \
    cargo test test_ai_matrix --features slow_tests -- --nocapture
else
  NUM_GAMES="$NUM_GAMES" cargo test test_ai_matrix -- --nocapture
fi
