# ML AI System Documentation

This document explains the machine learning (ML) system powering one of the two AI opponents in the Royal Game of Ur. It is written for experienced programmers new to ML, covering architecture, training, features, and model structure.

The ML AI can be played against directly or watched as it competes against the Classic AI (Expectiminimax algorithm).

## What is the ML AI?

The ML AI is a neural network agent that learns to play by imitating a strong Classic AI (using the expectiminimax algorithm) and, optionally, through self-play. The goal is to create a strong opponent with a distinct, learned playstyle.

## Why This Matters

This ML AI represents a fascinating intersection of ancient games and modern AI. While the Classic AI uses traditional game theory (expectiminimax search), the ML AI learns patterns from data - much like how humans learn to play games. This creates two fundamentally different approaches to the same strategic challenge, offering players unique experiences and researchers insights into AI development.

## Architecture

- **Input:** 150-dimensional feature vector representing the game state
- **Model:** Two neural networks ("heads") sharing input:
  - Value network: predicts expected outcome
  - Policy network: predicts best move (probability distribution)
- **Output:** Move with highest combined score (value + policy + bonuses)

## Features

The input vector encodes:

- Piece positions, board occupancy, rosette control
- Pieces on board, finished pieces
- Average position, safety, center lane control
- Current player, dice roll, valid moves
- Capture opportunities, vulnerability, progress
- Advanced: mobility, development, tactics, rosette safety, center control, coordination, attack/defense, endgame, time, material, positional advantage

## Model Structure

- Input: 150 features
- Hidden: 256 → 128 → 64 → 32 (ReLU activation)
- Output: Value (1 neuron, tanh), Policy (7 neurons, softmax)

**Note:** The current implementation uses ReLU activations without dropout regularization. Dropout could be added in future versions to improve generalization if overfitting becomes an issue.

## Current Performance

The ML AI is competitive with the Classic AI (Expectiminimax algorithm) it was trained from, achieving approximately 50% win rate in head-to-head matches. This represents a strong baseline for a neural network trained through imitation learning.

### ML AI Versions

- **ML-v1**: Initial model with basic training
- **ML-v2**: Improved model with batch normalization, dropout, learning rate scheduling, and enhanced training pipeline
- **ML-v3**: Extended training with more games and epochs (when available)

### Recent Improvements (v2)

- **Enhanced Architecture**: Added batch normalization and dropout for better regularization
- **Improved Training**: Learning rate scheduling and early stopping
- **Better Optimizer**: AdamW with weight decay for improved convergence
- **Multiprocessing**: Parallel game generation for faster training
- **Validation Split**: Proper train/validation split for better generalization

## Future Improvements

Several directions could be explored to create a stronger AI:

### High Priority (Critical Issues)

- **Fix WASM Weight Persistence**: The current implementation creates a new `MLAI` instance on every call, which may cause the network to use uninitialized weights. This should be fixed by maintaining a global singleton in the Rust code.

- **Correct Training Loss**: The policy network currently applies softmax in the network definition AND uses CrossEntropyLoss, which may yield incorrect training signals. Should use raw logits with CrossEntropyLoss instead.

### Medium Priority (Performance & Architecture)

- **Unified Network Architecture**: Consider refactoring to a single network with two outputs (value and policy) to reduce duplication and inference cost. This would halve the forward passes needed during move evaluation.

- **Enhanced Training Data Generation**: Remove the overhead of per-move subprocess calls by enabling the Rust AI to output entire game trajectories in one call. This would allow scaling to more games efficiently.

- **Better Value Targets**: Use the Classic AI's evaluation function as value targets instead of just piece count difference. This would more directly train the value network to mimic the Classic AI's evaluation.

### Advanced Improvements (Research Directions)

- **Self-Play Reinforcement Learning**: After initial imitation learning, allow the neural network to play against itself or the Classic AI, using outcomes to fine-tune the networks. This could help discover strategies not present in the initial dataset.

- **Monte Carlo Tree Search (MCTS)**: Add lightweight search on top of the neural network. A 2-ply expectiminimax using the value network for terminal evaluations could catch simple tactics while remaining fast.

- **Feature Engineering Review**: Examine the 150 features and identify any that don't provide signal. Features like "king safety" (now renamed to "rosette safety") are Ur-specific, but some generic features might not be relevant.

### Code Quality & Maintainability

- **Refactor Training Script**: Break down the monolithic `train_ml_ai.py` script into smaller modules (features.py, model.py, training.py) for better maintainability.

- **Add Reproducibility**: Provide random seed control and save training metadata (hyperparameters, performance metrics) for consistent results.

- **Continuous Evaluation**: Implement automated testing that pits the ML AI against the Classic AI and reports win rates to track progress.

### Current Strengths

The ML AI is competitive with the Classic AI (Expectiminimax algorithm) it was trained from, achieving approximately 50% win rate in head-to-head matches. This represents a strong baseline for a neural network trained through imitation learning.

## Training Pipeline

1. **Data Generation:** Play games using Classic AI (Expectiminimax algorithm), extract features, expert move, and outcome
2. **Training:** Train networks (value: MSE loss, policy: cross-entropy, AdamW optimizer) with GPU acceleration (MPS/CUDA)
3. **Evaluation:** Test ML model vs Classic AI (Expectiminimax algorithm) (win rate, move quality, speed)

### GPU Training Support

The training system now supports GPU acceleration:
- **Apple Silicon (M1/M2/M3):** Uses Metal Performance Shaders (MPS) for 10-20x speedup
- **NVIDIA GPUs:** Uses CUDA for acceleration
- **Fallback:** CPU training if GPU unavailable

Training includes enhanced progress bars with real-time epoch and batch progress, live loss updates, and detailed metrics.

## Move Selection

- For each valid move, simulate, extract features, evaluate with both networks
- Select move with highest combined score
- Inspired by AlphaZero, but no tree search

## Why Use ML Instead of Search?

- **Speed**: The ML AI selects moves in milliseconds, without a deep search.
- **Unique Playstyle**: Its strategies are learned from data, not hand-coded, resulting in a different kind of opponent.
- **Efficiency**: The model runs efficiently in the browser via WebAssembly.

## How to Use or Retrain the ML AI

- You can play against the ML AI in the app, or watch it play against the Classic AI (Expectiminimax algorithm).
- To retrain the model, generate new games, adjust features, or change the architecture and retrain using the provided Python scripts.
- To make the AI stronger, use more data, deeper networks, self-play, or new features.

## See Also

- [AI System Documentation](./ai-system.md)
- [Architecture Overview](./architecture-overview.md)
- [Game Rules and Strategy](./game-rules-strategy.md)

## References

- [Wikipedia: Royal Game of Ur](https://en.wikipedia.org/wiki/Royal_Game_of_Ur) – Overview of the ancient board game's history and mechanics.
- [Expectiminimax Algorithm Explained](https://en.wikipedia.org/wiki/Backgammon#Computer_play) – Core algorithm used for decision-making under uncertainty in games with chance elements.
- [Strongly Solving the Royal Game of Ur](https://royalur.net/articles/solving/) – In-depth article explaining how AI researchers computed optimal play.
- Silver et al., AlphaZero/AlphaGo ([Nature 2017](https://www.nature.com/articles/nature24270), [Nature 2016](https://www.nature.com/articles/nature16961)) – Foundational papers on neural network game AI.
- Russell & Norvig, "Artificial Intelligence: A Modern Approach" – Comprehensive AI textbook covering game theory and search algorithms.

## Further Reading

- [Neural Networks and Deep Learning (Michael Nielsen, free online book)](http://neuralnetworksanddeeplearning.com/) – Excellent introduction to neural networks.
- [PyTorch Tutorials](https://pytorch.org/tutorials/) – Official tutorials for the PyTorch framework used in training.
- [Google ML Crash Course](https://developers.google.com/machine-learning/crash-course) – Free machine learning fundamentals course.
- [RoyalUr.net](https://royalur.net/) – Play the game online, explore AI insights, and learn about the "solved" game strategy.

## FAQ

- **Can I retrain the model?** Yes, generate new games, adjust features, or change the architecture and retrain.
- **How do I make the AI stronger?** The current model is competitive with its training data. For improvements, try self-play training, larger networks, or better features.
- **Where do I start with ML?** See "Further Reading" above.
- **Is the current AI strong enough?** Yes, it's competitive with the Classic AI and provides a good foundation for further research.
