#!/bin/bash

set -euo pipefail

REPOSITORY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPOSITORY_ROOT"

if ! command -v uv >/dev/null 2>&1; then
    echo "uv is required: https://docs.astral.sh/uv/" >&2
    exit 1
fi

COMMAND=(uv run --project ml --locked python ml/scripts/train.py "$@")
if command -v caffeinate >/dev/null 2>&1; then
    exec caffeinate -i "${COMMAND[@]}"
fi

exec "${COMMAND[@]}"
