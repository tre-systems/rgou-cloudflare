#!/usr/bin/env bash

set -euo pipefail

REPORT=${1:-matrix}
NUM_GAMES=${NUM_GAMES:-50}
REPOSITORY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

case "$REPORT" in
  matrix)
    ;;
  deployed)
    export AI_MATRIX_DEPLOYED_ONLY=1
    ;;
  *)
    echo "Unknown AI matrix report: $REPORT" >&2
    exit 2
    ;;
esac

cd "$REPOSITORY_ROOT/worker/rust_ai_core"
NUM_GAMES="$NUM_GAMES" cargo test test_ai_matrix -- --nocapture \
  | AI_MATRIX_REPORT="$REPORT" node "$REPOSITORY_ROOT/scripts/format-ai-matrix-md.cjs"
