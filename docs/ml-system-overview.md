# ML System Overview

## Overview

The Royal Game of Ur AI system uses a combination of traditional game tree search (Expectiminimax) and machine learning approaches. The system has evolved to include genetic parameter optimization for improved AI performance.

## AI Types

### 1. Expectiminimax AI (EMM)

- **Implementation**: Traditional game tree search with alpha-beta pruning
- **Depth**: Configurable (1-4 levels)
- **Performance**: Excellent strategic play, moderate speed
- **Genetic Parameters**: Uses evolved parameters by default for optimal performance

### 2. Heuristic AI

- **Implementation**: Rule-based evaluation with position scoring
- **Speed**: Very fast (< 1ms per move)
- **Performance**: Good for educational purposes and real-time play
- **Genetic Parameters**: Uses evolved parameters by default

### 3. Machine Learning AI

- **Implementation**: Neural network-based evaluation
- **Architecture**: Multi-layer perceptron with value and policy heads
- **Training**: Self-play reinforcement learning
- **Performance**: Competitive with EMM, slower but more adaptive

## Genetic Parameter Evolution

### Evolution System

- **Implementation**: Pure Rust genetic algorithm
- **Optimization**: Tournament-style evaluation against default parameters
- **Parallelization**: Full CPU utilization with Apple Silicon optimization
- **Output**: Evolved parameters saved to `ml/data/genetic_params/evolved.json`

### Parameter Types

- `win_score`: Value for winning positions
- `finished_piece_value`: Bonus for completed pieces
- `position_weight`: Weight for board position evaluation
- `safety_bonus`: Bonus for safe piece positions
- `rosette_control_bonus`: Bonus for controlling rosette squares
- `advancement_bonus`: Bonus for piece advancement
- `capture_bonus`: Bonus for capture opportunities
- `center_lane_bonus`: Bonus for center lane control

### Evolution Results

- **Performance**: Evolved parameters show 51% win rate vs defaults
- **Key Changes**: Reduced win_score, increased rosette_control_bonus
- **Integration**: Automatically used by all EMM and Heuristic AIs

## Training System

### Data Generation

- **Method**: Self-play games with parallel processing
- **Features**: 50+ game state features
- **Targets**: Value function (win/loss prediction) and policy (move probabilities)

### Neural Network Architecture

- **Input**: 50+ game state features
- **Hidden Layers**: Configurable (typically 2-3 layers)
- **Output**: Value (1 neuron) and policy (7 neurons for piece selection)

### Training Process

- **Algorithm**: Stochastic gradient descent
- **Loss**: Combined value and policy loss
- **Validation**: Separate validation set for overfitting detection

## Performance Comparison

### AI Matrix Results (with evolved parameters)

1. **ML-PyTorch-V5**: 66.7% average win rate
2. **EMM-Depth3**: 65.6% average win rate
3. **ML-Hybrid**: 62.2% average win rate
4. **ML-Fast**: 62.2% average win rate
5. **EMM-Depth2**: 56.7% average win rate

### Speed Analysis

- **Heuristic**: 0.0ms/move (Very Fast)
- **EMM-Depth3**: 15.2ms/move (Moderate)
- **ML AIs**: 50-60ms/move (Slow)

## File Structure

```
ml/
├── config/
│   └── training.json          # Training configuration
├── data/
│   ├── genetic_params/
│   │   ├── default.json       # Default genetic parameters
│   │   └── evolved.json       # Evolved genetic parameters
│   └── weights/
│       ├── ml_ai_weights_fast.json
│       ├── ml_ai_weights_v2.json
│       └── ...                # Other model weights
└── scripts/
    ├── train.py               # Python training script (GPU)
    └── train.sh               # Training orchestration
```

## Usage

### Running Evolution

```bash
cd worker/rust_ai_core
cargo run --release --bin evolve_params
```

### Running Tests

```bash
npm run check  # Full test suite including AI matrix
```

### Production Integration

- Evolved parameters are automatically loaded by the WASM API
- All EMM and Heuristic AIs use evolved parameters by default
- Fallback to default parameters if evolved file is missing

## Future Improvements

1. **Continuous Evolution**: Periodic re-evolution of parameters
2. **Multi-Objective Optimization**: Balance performance vs speed
3. **Adaptive Parameters**: Dynamic parameter adjustment based on opponent
4. **Ensemble Methods**: Combine multiple parameter sets for better performance
