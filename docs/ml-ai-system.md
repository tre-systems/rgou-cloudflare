# ML AI System Documentation

## Overview

The ML AI system provides a neural network-based AI opponent for the Royal Game of Ur. It uses a dual-network architecture with value and policy networks trained on expert gameplay data.

## Architecture

### Core Components

1. **Rust ML Core** (`worker/ml_ai_core/`)
   - Neural network implementation
   - Game feature extraction (100-dimensional feature vector)
   - Training infrastructure
   - WASM compilation for browser deployment

2. **Frontend Integration**
   - ML AI service with Web Worker communication
   - Automatic weight loading from `/ml-weights.json`
   - AI selector component integration

3. **Training Pipeline**
   - Python training script with PyTorch
   - Integration with existing Rust AI for expert data generation
   - Weight export for Rust/WASM deployment

## Feature Engineering

The ML AI uses a 100-dimensional feature vector:

### Piece Positions (28 features)

- Player 1 piece positions (14 features)
- Player 2 piece positions (14 features)
- Normalized positions: `square / 20.0` for on-board pieces
- `1.0` for finished pieces (square 20)
- `-1.0` for off-board pieces

### Board Occupancy (21 features)

- `1.0` for Player 1 pieces
- `-1.0` for Player 2 pieces
- `0.0` for empty squares

### Strategic Features (51 features)

- Rosette control score
- Pieces on board count (both players)
- Finished pieces count (both players)
- Average position score (both players)
- Safety score (both players)
- Center lane control (both players)
- Current player indicator
- Dice roll (normalized)
- Valid moves count
- Capture opportunities (both players)
- Vulnerability to capture (both players)
- Progress towards finish (both players)

## Neural Network Architecture

### Value Network

- Input: 100 features
- Hidden layers: 64 → 32 neurons
- Output: 1 value (tanh activation, range [-1, 1])
- Purpose: Position evaluation

### Policy Network

- Input: 100 features
- Hidden layers: 64 → 32 neurons
- Output: 7 move probabilities (softmax activation)
- Purpose: Move selection

## Training Process

### Data Generation

The training script can generate data in two ways:

1. **Expert AI Data** (recommended)

   ```bash
   npm run train:ml
   ```

   - Uses existing Rust AI as teacher
   - Generates realistic game positions
   - Provides high-quality training targets

2. **Synthetic Data** (fallback)

   ```bash
   npm run train:ml:synthetic
   ```

   - Generates random game positions
   - Uses random evaluations and policies
   - Useful for testing the pipeline

### Training Configuration

```bash
python scripts/train_ml_ai.py \
  --num-games 1000 \
  --epochs 100 \
  --batch-size 32 \
  --learning-rate 0.001 \
  --output ml_ai_weights.json \
  --use-rust-ai
```

### Training Output

The training script produces:

- `ml_ai_weights.json`: Trained network weights
- Network configurations for Rust deployment
- Training progress and loss metrics

## Deployment

### Building the System

1. **Build Rust AI CLI** (for training data generation)

   ```bash
   npm run build:rust-ai
   ```

2. **Build ML WASM** (for browser deployment)

   ```bash
   npm run build:ml-wasm
   ```

3. **Load Trained Weights**
   ```bash
   npm run load:ml-weights ml_ai_weights.json
   ```

### Frontend Integration

The ML AI automatically loads weights from `/ml-weights.json` on initialization. If no weights are found, it uses randomly initialized networks.

## Usage

### Selecting ML AI

Users can select the ML AI from the AI selector component:

- **Classic AI**: Expectiminimax algorithm (6-ply search)
- **Server AI**: Cloudflare Worker (4-ply search)
- **ML AI**: Neural network-based AI

### Performance Characteristics

- **Speed**: Fast inference (typically < 100ms)
- **Strength**: Varies based on training quality
- **Memory**: ~50KB for network weights
- **Reliability**: Fallback to random moves if networks fail

## Development Workflow

### Setting Up Development Environment

1. **Install Python Dependencies**

   ```bash
   pip install -r requirements.txt
   ```

2. **Build Rust Components**

   ```bash
   npm run build:rust-ai
   npm run build:ml-wasm
   ```

3. **Train Initial Model**
   ```bash
   npm run train:ml
   npm run load:ml-weights ml_ai_weights.json
   ```

### Iterative Training

1. **Generate Training Data**

   ```bash
   npm run train:ml -- --num-games 5000
   ```

2. **Train Networks**

   ```bash
   npm run train:ml -- --epochs 200 --learning-rate 0.0005
   ```

3. **Load and Test**
   ```bash
   npm run load:ml-weights ml_ai_weights.json
   npm run dev
   ```

### Testing

The ML AI system includes comprehensive tests:

- Unit tests for feature extraction
- Neural network functionality tests
- Integration tests with game logic

## Troubleshooting

### Common Issues

1. **Missing Python Dependencies**

   ```bash
   pip install numpy torch torchvision matplotlib tqdm
   ```

2. **Rust AI Not Found**

   ```bash
   npm run build:rust-ai
   ```

3. **WASM Loading Failures**

   ```bash
   npm run build:ml-wasm
   npm run build:wasm-assets
   ```

4. **Weights Not Loading**
   - Check that `/ml-weights.json` exists in public directory
   - Verify weights file format matches expected structure
   - Check browser console for loading errors

### Debug Mode

Enable debug logging by setting:

```javascript
localStorage.setItem('ml-ai-debug', 'true');
```

## Future Improvements

### Potential Enhancements

1. **Self-Play Training**
   - Implement reinforcement learning
   - Use self-play to improve beyond expert AI

2. **Model Compression**
   - Quantize weights for smaller file sizes
   - Prune unnecessary connections

3. **Ensemble Methods**
   - Combine multiple neural networks
   - Blend with traditional AI approaches

4. **Online Learning**
   - Update models based on game outcomes
   - Adaptive strength adjustment

### Performance Optimization

1. **WASM Optimization**
   - Use SIMD instructions
   - Optimize memory layout

2. **Network Architecture**
   - Experiment with different architectures
   - Add attention mechanisms

3. **Feature Engineering**
   - Add more sophisticated features
   - Use learned feature representations

## API Reference

### ML AI Service

```typescript
interface MLAIService {
  loadWeights(weights: MLWeights): Promise<void>;
  getAIMove(gameState: GameState): Promise<MLResponse>;
  evaluatePosition(gameState: GameState): Promise<EvaluationResponse>;
}
```

### ML Response

```typescript
interface MLResponse {
  move: number | null;
  evaluation: number;
  thinking: string;
  diagnostics: MLDiagnostics;
  timings: {
    ai_move_calculation: number;
    total_handler_time: number;
  };
}
```

### ML Weights

```typescript
interface MLWeights {
  value_weights: number[];
  policy_weights: number[];
  value_network_config: NetworkConfig;
  policy_network_config: NetworkConfig;
}
```
