#!/bin/bash

# Check status of ML training run for Royal Game of Ur
# Safe to run while training is ongoing

TRAIN_SCRIPT="scripts/train_ml_ai.py"
OUTPUT_WEIGHTS="ml/data/weights/ml_ai_weights_overnight.json"
CACHE_FILE="training_data_cache.json"

# 1. Check for running training process
PROCESS=$(ps aux | grep "$TRAIN_SCRIPT" | grep -v grep)
if [ -n "$PROCESS" ]; then
    echo "✅ Training process is running:"
    echo "$PROCESS" | awk '{print "  PID: "$2"  CPU: "$3"%  MEM: "$4"%  START: "$9}'
else
    echo "❌ No active training process found."
fi

echo
# 2. Check for output files
if [ -f "$CACHE_FILE" ]; then
    echo "📦 $CACHE_FILE:"
    ls -lh "$CACHE_FILE"
else
    echo "❌ $CACHE_FILE not found."
fi

echo
if ls ${OUTPUT_WEIGHTS}* 1>/dev/null 2>&1; then
    echo "📦 Output weights files:"
    ls -lh ${OUTPUT_WEIGHTS}*
else
    echo "❌ No output weights file (${OUTPUT_WEIGHTS}*) found yet."
fi

echo
# 3. Show most recently modified files
ls -lt | head -10 | awk '{print $6, $7, $8, $9}'

echo
# 4. Show top CPU processes (optional)
echo "Top CPU processes:"
top -l 1 -o cpu | head -15
