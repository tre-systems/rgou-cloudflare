# ML AI System Documentation

See also: [AI System Documentation (Classic Expectiminimax)](./ai-system.md)

## Overview

This document explains the machine learning (ML) system powering one of the two AI opponents in the Royal Game of Ur. It is written for experienced programmers new to ML, covering architecture, training, features, and model structure.

The ML AI can be played against directly or watched as it competes against the Classic AI.

## What is the ML AI?

The ML AI is a neural network agent that learns to play by imitating a strong expectiminimax AI (the "Classic AI") and, optionally, through self-play. The goal is to create a strong opponent with a distinct, learned playstyle.

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
- Advanced: mobility, development, tactics, king safety, center control, coordination, attack/defense, endgame, time, material, positional advantage

## Model Structure

- Input: 150 features
- Hidden: 256 → 128 → 64 → 32 (ReLU, dropout)
- Output: Value (1 neuron, tanh), Policy (7 neurons, softmax)

## Training Pipeline

1. **Data Generation:** Play games using expectiminimax AI, extract features, expert move, and outcome
2. **Training:** Train networks (value: MSE loss, policy: cross-entropy, AdamW optimizer)
3. **Evaluation:** Test ML model vs expectiminimax AI (win rate, move quality, speed)

## Move Selection

- For each valid move, simulate, extract features, evaluate with both networks
- Select move with highest combined score
- Inspired by AlphaZero, but no tree search

## Why Use ML Instead of Search?

- **Speed**: The ML AI selects moves in milliseconds, without a deep search.
- **Unique Playstyle**: Its strategies are learned from data, not hand-coded, resulting in a different kind of opponent.
- **Efficiency**: The model runs efficiently in the browser via WebAssembly.

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
- **How do I make the AI stronger?** Use more data, deeper networks, self-play, or new features.
- **Where do I start with ML?** See "Further Reading" above.
