# Checking ML Training Status

_How to safely check the status of ML training runs._

## Quick Check (Recommended)

```bash
bash scripts/check_training_status.sh
```

This script shows:

- Training process status and resource usage
- Size and modification time of `training_data_cache.json`
- Output weights files existence
- Recent file activity
- Top CPU processes

## Manual Checks

### Check Running Process

```bash
ps aux | grep train_ml_ai.py | grep -v grep
```

### Check Output Files

```bash
ls -lh training_data_cache.json ml/data/weights/ml_ai_weights_overnight.json*
```

### Check Recent Activity

```bash
ls -lt | head -10
```

### Check CPU Usage

```bash
top -o cpu
```

## Status Indicators

- **Training Running**: Python process with high CPU
- **Training Complete**: Large weights file exists
- **Check Terminal**: Look for log output in training terminal

## Related Documentation

- [ML AI System](./ml-ai-system.md) - Training and AI implementation
- [Mac Optimization Guide](./mac-optimization-guide.md) - Performance optimization
