# Checking ML Training Status

To safely check the status of a Royal Game of Ur ML training run, follow these steps:

## 1. Use the Provided Script (Recommended)

Run this command from your project root:

```bash
bash scripts/check_training_status.sh
```

This script will:

- Show if the training process is running and its resource usage
- Show the size and last modification time of `training_data_cache.json`
- Show if output weights files (e.g., `ml_ai_weights_overnight.json`) exist
- List the 10 most recently modified files
- Show the top CPU processes (for troubleshooting)

## 2. Manual Checks (Advanced)

### Check for Running Training Process

```bash
ps aux | grep train_ml_ai.py | grep -v grep
```

### Check Output Files

```bash
ls -lh training_data_cache.json ml_ai_weights_overnight.json*
```

### Check Recent File Activity

```bash
ls -lt | head -10
```

### Check CPU Usage

```bash
top -o cpu
```

## Notes

- The script is safe to run while training is ongoing.
- If you see a Python process with high CPU, training is still running.
- If you see a large weights file (e.g., `ml_ai_weights_overnight.json`), training has finished.
- If in doubt, check the terminal where you started the training for log output.
