# ML AI System Documentation

**See Also:** [AI System Documentation (Classic Expectiminimax)](./ai-system.md) — for details on the classic search-based AI.
**See Also:** [Architecture Overview](./architecture-overview.md) — for system context and integration.

## Overview

This document explains the machine learning (ML) system used to power the Royal Game of Ur AI. It is written for experienced programmers who may be new to ML, and covers the architecture, training pipeline, features, model structure, and references for further reading.

---

## What is the ML AI?

The ML AI is a neural network-based agent that learns to play the Royal Game of Ur by imitating a strong deterministic AI (expectiminimax) and, optionally, through self-play. The goal is to create an AI that can match or exceed the performance of traditional search-based algorithms, but with much faster move selection.

---

## Architecture

- **Input:** A feature vector representing the current game state (150 features).
- **Model:** Two neural networks ("heads") sharing the same input:
  - **Value Network:** Predicts the value (expected outcome) of the current position.
  - **Policy Network:** Predicts the best move to make (probability distribution over possible moves).
- **Output:**
  - The move with the highest score (combining value and policy outputs, plus bonuses for captures, finishes, etc.).

---

## Features

The input to the neural network is a 150-dimensional feature vector encoding:

- Piece positions for both players
- Board occupancy
- Rosette control
- Pieces on board, finished pieces
- Average position, safety, center lane control
- Current player, dice roll, valid moves count
- Capture opportunities, vulnerability, progress to finish
- Advanced features: mobility, development, tactical opportunities, king safety, center control, piece coordination, attack/defense, endgame, time advantage, material balance, positional advantage

This rich feature set allows the network to "see" the strategic and tactical aspects of the game.

---

## Model Structure

Both the value and policy networks are deep, fully connected feedforward neural networks:

- **Input layer:** 150 features
- **Hidden layers:** 256 → 128 → 64 → 32 neurons, with ReLU activations and dropout for regularization
- **Output:**
  - Value: 1 neuron (tanh activation, predicts [-1, 1] outcome)
  - Policy: 7 neurons (softmax activation, one for each possible move)

---

## Training Pipeline

(For details on how the classic AI generates expert moves for training, see [AI System Documentation](./ai-system.md).)

1. **Data Generation:**
   - Play thousands of games using the deterministic AI (expectiminimax, depth 4+)
   - For each move, extract features, the expert move (policy), and the game outcome (value)
   - Optionally, save these games for future reuse

2. **Training:**
   - Use the generated data to train the neural networks
   - Loss functions:
     - Value: Mean squared error (MSE) between predicted and actual outcome
     - Policy: Cross-entropy loss between predicted and expert move
   - Optimizer: AdamW (adaptive learning rate)
   - Training runs for many epochs (e.g., 300) over the dataset

3. **Evaluation:**
   - After training, the ML model is tested against the deterministic AI in 100+ games
   - Metrics: win rate, average pieces finished, move quality, speed

---

## How the ML AI Makes Moves

- For each valid move, the AI simulates the move, extracts features, and evaluates the resulting state using the value and policy networks.
- The move with the highest combined score (value + policy + bonuses for captures, finishes, etc.) is selected.
- This approach is inspired by AlphaZero-style architectures, but without tree search.

---

## Why Use ML Instead of Search?

(For a comparison with the classic expectiminimax search, see [AI System Documentation](./ai-system.md).)

- **Speed:** Once trained, the ML AI can select moves in milliseconds, much faster than search-based AIs.
- **Generalization:** The ML AI can learn subtle strategies and tactics from data, not just brute-force search.
- **Deployment:** The model can run efficiently on the web, mobile, or server.

---

## Key References

- **AlphaZero/AlphaGo:**
  - [Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm (Silver et al., 2017)](https://www.nature.com/articles/nature24270)
  - [AlphaGo: Mastering the game of Go with deep neural networks and tree search (Silver et al., 2016)](https://www.nature.com/articles/nature16961)
- **Expectiminimax Algorithm:**
  - [Wikipedia: Expectiminimax](https://en.wikipedia.org/wiki/Expectiminimax)
  - [Russell & Norvig, Artificial Intelligence: A Modern Approach (4th ed.), Ch. 6](https://aima.cs.berkeley.edu/)
- **Neural Networks for Board Games:**
  - Russell & Norvig, "Artificial Intelligence: A Modern Approach" ([AIMA](https://aima.cs.berkeley.edu/))
  - Wikipedia: [Neural network](https://en.wikipedia.org/wiki/Neural_network)
- **Adversarial Search and Game AI:**
  - Wikipedia: [Expectiminimax](https://en.wikipedia.org/wiki/Expectiminimax)
  - Russell & Norvig, "Artificial Intelligence: A Modern Approach" ([AIMA](https://aima.cs.berkeley.edu/))
- **Royal Game of Ur:**
  - Irving Finkel, "On the Rules for the Royal Game of Ur" ([PDF, Academia.edu](https://www.academia.edu/15173145/On_the_Rules_for_the_Royal_Game_of_Ur))
  - RoyalUr.net: [Rules and History](https://royalur.net/learn)

---

## Further Reading

- [A Beginner’s Guide to Neural Networks and Deep Learning](https://skymind.ai/wiki/neural-network)
- [PyTorch Tutorials](https://pytorch.org/tutorials/)
- [Machine Learning for Programmers (Google Developers)](https://developers.google.com/machine-learning/crash-course)

---

## FAQ

**Q: Can I retrain the model with my own data or tweaks?**
A: Yes! You can generate new games, adjust features, or change the model architecture and retrain as you like.

**Q: How do I make the AI even stronger?**
A: Use more training data, deeper networks, self-play, or experiment with new features and architectures.

**Q: Where do I start if I want to learn more about ML?**
A: See the "Further Reading" section above for beginner-friendly resources.

---

If you have more questions or want to dive deeper, just ask!
