#!/bin/bash

set -euo pipefail

REPOSITORY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPOSITORY_ROOT"

if ! command -v uv >/dev/null 2>&1; then
    echo "uv is required: https://docs.astral.sh/uv/" >&2
    exit 1
fi

show_usage() {
    cat <<'EOF'
Usage: ml/scripts/load-weights.sh [--promote]
       ml/scripts/load-weights.sh WEIGHTS [CONVERSION OPTIONS]

With no arguments, promotes the configured production model. Conversion options:
  --format {unified|pytorch|rust}
  --source-weight-layout {runtime|pytorch}
  --validate
  --output FILE
EOF
}

case "${1:-}" in
    --help|-h)
        show_usage
        exit 0
        ;;
esac

PYTHON="$(uv python find "$(cat ml/.python-version)")"

if [ $# -eq 0 ]; then
    exec "$PYTHON" ml/scripts/model_provenance.py promote
fi

if [ "$1" = "--promote" ]; then
    if [ $# -ne 1 ]; then
        echo "--promote does not accept a model path; replace the canonical source first" >&2
        exit 1
    fi
    exec "$PYTHON" ml/scripts/model_provenance.py promote
fi

exec "$PYTHON" ml/scripts/convert_weights.py "$@"
