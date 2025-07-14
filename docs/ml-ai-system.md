# ML AI System Documentation

See also: [AI System Documentation (Classic Expectiminimax)](./ai-system.md), [Architecture Overview](./architecture-overview.md)

## Overview

This document explains the machine learning (ML) system powering the Royal Game of Ur AI. It is written for experienced programmers new to ML, covering architecture, training, features, model structure, and references.

## What is the ML AI?

The ML AI is a neural network agent that learns to play by imitating a strong deterministic AI (expectiminimax) and, optionally, through self-play. The goal is to match or exceed traditional search-based AI performance, but with much faster move selection.

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

1. **Data Generation:** Play games using deterministic AI, extract features, expert move, and outcome
2. **Training:** Train networks (value: MSE loss, policy: cross-entropy, AdamW optimizer)
3. **Evaluation:** Test ML model vs deterministic AI (win rate, move quality, speed)

## Move Selection

- For each valid move, simulate, extract features, evaluate with both networks
- Select move with highest combined score
- Inspired by AlphaZero, but no tree search

## Why Use ML Instead of Search?

- Speed: ML AI selects moves in milliseconds
- Generalization: Learns subtle strategies from data
- Deployment: Runs efficiently on web, mobile, or server

## References

- Silver et al., AlphaZero/AlphaGo ([Nature 2017](https://www.nature.com/articles/nature24270), [Nature 2016](https://www.nature.com/articles/nature16961))
- [Wikipedia: Expectiminimax](https://en.wikipedia.org/wiki/Expectiminimax)
- [Russell & Norvig, AIMA](https://aima.cs.berkeley.edu/)
- [Neural network](https://en.wikipedia.org/wiki/Neural_network)
- [Irving Finkel, "On the Rules for the Royal Game of Ur" (PDF)](https://www.academia.edu/15173145/On_the_Rules_for_the_Royal_Game_of_Ur)
- [RoyalUr.net: Rules and History](https://royalur.net/learn)

## Further Reading

- [A Beginner’s Guide to Neural Networks and Deep Learning](https://skymind.ai/wiki/neural-network)
- [PyTorch Tutorials](https://pytorch.org/tutorials/)
- [Google ML Crash Course](https://developers.google.com/machine-learning/crash-course)

## FAQ

- **Can I retrain the model?** Yes, generate new games, adjust features, or change the architecture and retrain.
- **How do I make the AI stronger?** Use more data, deeper networks, self-play, or new features.
- **Where do I start with ML?** See "Further Reading" above.
