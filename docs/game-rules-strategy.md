# Game Rules and Strategy Guide

## Historical Context

The Royal Game of Ur is one of the oldest known board games, dating to around 2500 BCE in Mesopotamia. Discovered in the Royal Cemetery of Ur, it was played for over 3000 years across the ancient world. The rules were reconstructed from archaeological finds and cuneiform texts by scholars like Irving Finkel of the British Museum.

## Game Overview

The Royal Game of Ur is a strategic race game for two players. Each player tries to move all seven pieces around a unique board and off the finish line before their opponent. The game masterfully combines luck (from dice rolls) with strategic decision-making, featuring special "rosette" squares that grant extra turns and serve as safe havens.

Think of it as a cross between backgammon and chess - with the tactical depth of chess but the accessibility of backgammon.

## Board Layout

- 20 squares in a unique pattern
- Starting areas: pieces begin off the board
- Shared center lane: squares 4-11
- Rosette squares: 0, 7, 13, 15, 16 (safe, extra turn)
- Finish line: square 20 (off the board)

### Player Tracks

- Player 1: 3 → 2 → 1 → 0 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 20
- Player 2: 19 → 18 → 17 → 16 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 14 → 15 → 20

## Game Rules

1. **Setup**: 7 pieces per player, off the board
2. **Dice**: 4 tetrahedral dice (0-4 result)
3. **Movement**: Roll dice, choose a piece, move along your track
4. **Valid Moves**: From start, on board, or to finish (must land exactly)
5. **Invalid Moves**: Beyond finish, own piece on target, opponent on rosette
6. **Rosettes**: Safe, extra turn
7. **Captures**: Land on opponent (not on rosette) to send them to start
8. **Roll of Zero**: No move, pass turn
9. **Winning**: First to finish all 7 pieces wins

## Strategy

### Opening

- Get pieces on board
- Control rosettes
- Avoid clustering
- Diversify threats

### Mid-Game

- Maintain rosette control
- Look for captures
- Block opponent
- Advance pieces
- Balance risk and reward

### End-Game

- Prioritize finishing
- Defend near finish
- Block opponent
- Use moves efficiently

### Advanced Tactics

- Secure key rosettes (7, 13)
- Use rosettes for defense and attack
- Capture high-value targets
- Avoid risky captures if vulnerable
- Plan for zero rolls
- Use high rolls for finishing, rosettes, or captures

### Common Mistakes

- Ignoring rosettes
- Over-aggression
- Poor positioning
- Not considering opponent's responses
- Wasting high rolls
- Missing captures
- Inefficient movement

## AI Behavior

- The default AI is the **Classic AI (Expectiminimax algorithm)**, which performs deep calculation (6-ply), strong positional play, and focuses on rosettes and safe moves. It can be cautious—aggressive play may exploit this.
- An alternative **ML AI (Neural network model)** is also available, offering a different playstyle learned from data.

## Historical Significance

- Ancient mathematics and probability
- Social and cultural insight
- Strategic thinking in early societies

## References and Further Reading

- [Wikipedia: Royal Game of Ur](https://en.wikipedia.org/wiki/Royal_Game_of_Ur) – Comprehensive overview of the ancient board game's history, mechanics, and cultural significance.
- [Tom Scott vs Irving Finkel (YouTube)](https://www.youtube.com/watch?v=WZskjLq040I) – British Museum curator teaches the game in an entertaining and accessible way.
- [RoyalUr.net: Rules and History](https://royalur.net/learn) – Detailed rules, strategy guides, and historical context.
- [Strongly Solving the Royal Game of Ur](https://royalur.net/articles/solving/) – In-depth article explaining how AI researchers computed optimal play.
- [AI System Documentation](./ai-system.md) for technical/game theory analysis
