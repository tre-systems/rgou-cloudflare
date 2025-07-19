# Parameterized ML Training System

## Overview

The parameterized ML training system allows you to train any ML version (v1, v2, v3, v4, v5, etc.) using a single, scalable infrastructure. This eliminates the need for separate scripts for each version and provides automatic scaling for future versions.

## Key Features

### 1. Version-Specific Configurations

Each ML version has predefined training parameters:

| Version | Games  | Epochs | Learning Rate | Description                              |
| ------- | ------ | ------ | ------------- | ---------------------------------------- |
| v1      | 100    | 50     | 0.001         | Initial ML AI training                   |
| v2      | 1,000  | 100    | 0.001         | Improved training infrastructure         |
| v3      | 5,000  | 300    | 0.0005        | Extended training for better performance |
| v4      | 10,000 | 500    | 0.0003        | Large-scale training                     |
| v5      | 20,000 | 1,000  | 0.0002        | Maximum training scale                   |

### 2. Automatic Scaling

For versions beyond v5, the system automatically scales parameters:

- Games: `base_games * (version_num / latest_known_version)`
- Epochs: `base_epochs * (version_num / latest_known_version)`
- Learning Rate: `base_lr / sqrt(version_num / latest_known_version)`

### 3. Flexible Overrides

All parameters can be overridden via command line arguments.

## Usage

### Quick Start

```bash
# Train ML-v3 (default)
npm run train:ml:version

# Train specific version
npm run train:ml:version v4

# Train with custom parameters
npm run train:ml:version v5 --no-test --output-dir custom/path
```

### Python Script Usage

```bash
# List available versions
python ml/scripts/train_ml_ai_version.py --list-versions

# Train specific version
python ml/scripts/train_ml_ai_version.py --version v3

# Override parameters
python ml/scripts/train_ml_ai_version.py --version v4 --num-games 15000 --epochs 600

# Train future version (auto-scales)
python ml/scripts/train_ml_ai_version.py --version v8
```

### Shell Script Options

```bash
# Basic usage
./ml/scripts/train_ml_ai_version.sh v3

# Skip building Rust AI
./ml/scripts/train_ml_ai_version.sh v4 --no-build

# Skip testing
./ml/scripts/train_ml_ai_version.sh v5 --no-test

# Skip evaluation
./ml/scripts/train_ml_ai_version.sh v3 --no-evaluate

# Custom output directory
./ml/scripts/train_ml_ai_version.sh v4 --output-dir custom/path

# Show help
./ml/scripts/train_ml_ai_version.sh --help
```

## File Structure

### Training Scripts

- `ml/scripts/train_ml_ai_version.py` - Main parameterized training script
- `ml/scripts/train_ml_ai_version.sh` - Shell wrapper with options
- `ml/scripts/train_ml_ai.py` - Base training infrastructure

### Test Infrastructure

- `worker/rust_ai_core/tests/generate_ml_tests.rs` - Dynamic test generator
- `worker/rust_ai_core/tests/ml_vs_expectiminimax.rs` - Legacy test functions

### Output Files

- `ml/data/weights/ml_ai_weights_v{version}.json` - Trained weights
- `ml/data/weights/ml_ai_weights_v{version}.json.gz` - Compressed weights

## Configuration System

### Version Configurations

Each version configuration includes:

- `num_games`: Number of games to simulate
- `epochs`: Training epochs
- `learning_rate`: Learning rate
- `improvements`: List of improvements for this version
- `use_rust_ai`: Whether to use Rust AI for training data
- `validation_split`: Validation data ratio
- `quantize`: Whether to quantize weights
- `compress`: Whether to compress weights

### Base Configuration

All versions inherit these base settings:

- `use_rust_ai`: true
- `validation_split`: 0.15
- `quantize`: true
- `compress`: true
- `seed`: 42

## Testing System

### Dynamic Test Generation

The system automatically generates test functions for each version:

- `test_ml_v1_vs_expectiminimax_ai`
- `test_ml_v2_vs_expectiminimax_ai`
- `test_ml_v3_vs_expectiminimax_ai`
- etc.

### Adding New Versions

To add a new version test, simply add this line to `generate_ml_tests.rs`:

```rust
generate_ml_test!(test_ml_v6_vs_expectiminimax_ai, "v6", "ml_ai_weights_v6.json");
```

### Running Tests

```bash
# Test specific version
cd worker/rust_ai_core
cargo test test_ml_v3_vs_expectiminimax_ai -- --nocapture

# Test all ML versions
cargo test test_ml_v -- --nocapture
```

## Training Process

### Phase 1: Data Generation

1. Build Rust AI core (if needed)
2. Generate training games using Rust AI
3. Extract features and targets from each move
4. Save training data cache

### Phase 2: Training

1. Split data into training/validation sets
2. Train value and policy networks
3. Monitor validation loss for early stopping
4. Apply learning rate scheduling

### Phase 3: Evaluation

1. Test against expectiminimax AI
2. Run full evaluation
3. Generate performance report

## Performance Monitoring

### Training Progress

- Progress printed every 10 epochs
- Validation loss monitored for early stopping
- Learning rate automatically reduced when needed

### Expected Training Times

| Version | Data Generation | Training   | Total          |
| ------- | --------------- | ---------- | -------------- |
| v1      | 5-10 min        | 30-60 min  | 35-70 min      |
| v2      | 15-30 min       | 1-2 hours  | 1.25-2.5 hours |
| v3      | 30-60 min       | 2-4 hours  | 2.5-5 hours    |
| v4      | 1-2 hours       | 4-8 hours  | 5-10 hours     |
| v5      | 2-4 hours       | 8-16 hours | 10-20 hours    |

## Troubleshooting

### Common Issues

1. **Out of Memory**: Reduce batch size or number of workers
2. **Slow Training**: Check GPU/MPS acceleration
3. **Poor Performance**: Increase games/epochs or adjust learning rate
4. **Overfitting**: Increase dropout or reduce model complexity

### Performance Optimization

1. **Use GPU/MPS**: Training will be much faster on GPU
2. **Parallel Workers**: Adjust based on CPU cores
3. **Batch Size**: Optimize for your hardware

## Future Versions

### Automatic Scaling

For versions beyond v5, the system automatically scales:

- v6: 24,000 games, 1,200 epochs, 0.00018 lr
- v7: 28,000 games, 1,400 epochs, 0.00017 lr
- v8: 32,000 games, 1,600 epochs, 0.00016 lr

### Manual Overrides

You can always override automatic scaling:

```bash
python ml/scripts/train_ml_ai_version.py --version v8 --num-games 50000 --epochs 2000
```

## Best Practices

### Version Naming

- Use semantic versioning: v1, v2, v3, etc.
- Document significant changes in version configurations
- Keep version numbers sequential

### Training Strategy

- Start with smaller versions for quick iteration
- Scale up gradually as infrastructure improves
- Monitor performance to determine optimal parameters

### Testing

- Always test new versions against expectiminimax AI
- Run multiple test runs for statistical significance
- Document performance improvements

## Conclusion

The parameterized ML training system provides a scalable, maintainable approach to training multiple ML versions. It eliminates code duplication, provides automatic scaling for future versions, and maintains consistent testing infrastructure across all versions.
