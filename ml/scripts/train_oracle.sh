#!/usr/bin/env bash
set -euo pipefail

command=(uv run --project ml --locked python ml/scripts/train_oracle.py "$@")
if command -v caffeinate >/dev/null 2>&1; then
  exec caffeinate -dimsu "${command[@]}"
fi
exec "${command[@]}"
