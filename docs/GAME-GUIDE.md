# Game Guide

This document provides a comprehensive guide to the Royal Game of Ur, including historical context, rules, strategy, and AI opponents.

## Historical Context

The Royal Game of Ur is one of the oldest known board games, dating to around 2500 BCE in Mesopotamia. Discovered in the Royal Cemetery of Ur, it was played for over 3000 years across the ancient world. The rules were reconstructed from archaeological finds and cuneiform texts by scholars like Irving Finkel of the British Museum.

The game masterfully combines luck (from dice rolls) with strategic decision-making, featuring special "rosette" squares that grant extra turns and serve as safe havens. Think of it as a cross between backgammon and chess - with the tactical depth of chess but the accessibility of backgammon.

## Game Overview

The Royal Game of Ur is a strategic race game for two players. Each player tries to move all seven pieces around a unique board and off the finish line before their opponent.

### Board Layout

- **20 squares** in a unique pattern
- **Starting areas**: pieces begin off the board
- **Shared center lane**: squares 4-11
- **Rosette squares**: 0, 7, 13, 15, 16 (safe, extra turn)
- **Finish line**: square 20 (off the board)

### Player Tracks

- **Player 1**: 3 → 2 → 1 → 0 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 20
- **Player 2**: 19 → 18 → 17 → 16 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 14 → 15 → 20

## Game Rules

### Setup

- 7 pieces per player, off the board
- 4 tetrahedral dice (0-4 result)
- Players alternate turns

### Movement

1. **Roll dice** to determine movement distance
2. **Choose a piece** to move
3. **Move along your track** according to the roll

### Valid Moves

- **From start**: Move a piece onto the board
- **On board**: Move a piece along your track
- **To finish**: Must land exactly on square 20

### Invalid Moves

- **Beyond finish**: Cannot move past square 20
- **Own piece**: Cannot land on your own piece
- **Opponent on rosette**: Cannot capture pieces on rosette squares

### Special Rules

#### Rosettes

- **Safe havens**: Pieces on rosette squares cannot be captured
- **Extra turn**: Landing on a rosette grants an additional turn
- **Key rosettes**: Squares 7 and 13 are particularly valuable

#### Captures

- **Land on opponent**: Send their piece back to start
- **Rosette protection**: Pieces on rosettes cannot be captured
- **Strategic value**: Captures can dramatically change game balance

#### Roll of Zero

- **No movement**: Roll of 0 means no piece can move
- **Pass turn**: Turn passes to opponent
- **Strategic impact**: Can be devastating in endgame

#### Winning

- **First to finish**: Player who moves all 7 pieces off the board wins
- **Exact landing**: Must land exactly on square 20 to finish

## Strategy Guide

### Opening Strategy

**Get pieces on board**:

- Start moving pieces as soon as possible
- Don't leave pieces on the board too long

**Control rosettes**:

- Secure key rosette squares (7, 13)
- Use rosettes for defense and attack

**Avoid clustering**:

- Spread pieces out to create multiple threats
- Don't bunch pieces together

**Diversify threats**:

- Create multiple paths to victory
- Keep opponent guessing

### Mid-Game Strategy

**Maintain rosette control**:

- Hold key rosette squares
- Use rosettes as safe havens

**Look for captures**:

- Identify vulnerable opponent pieces
- Plan capture sequences

**Block opponent**:

- Position pieces to block opponent's path
- Force opponent into unfavorable positions

**Advance pieces**:

- Keep pieces moving toward finish
- Balance advancement with safety

**Balance risk and reward**:

- Evaluate capture opportunities carefully
- Consider opponent's potential responses

### End-Game Strategy

**Prioritize finishing**:

- Focus on getting pieces to the finish
- Don't get distracted by captures

**Defend near finish**:

- Protect pieces close to finishing
- Use rosettes for final safety

**Block opponent**:

- Prevent opponent from finishing
- Create obstacles in their path

**Use moves efficiently**:

- Plan moves to maximize progress
- Avoid wasted movements

### Advanced Tactics

**Secure key rosettes**:

- Squares 7 and 13 are particularly valuable
- Control these squares when possible

**Use rosettes strategically**:

- Use rosettes for defense and attack
- Plan moves to land on rosettes

**Capture high-value targets**:

- Target opponent pieces close to finishing
- Consider the value of captured pieces

**Avoid risky captures**:

- Don't expose your own pieces unnecessarily
- Evaluate capture risks carefully

**Plan for zero rolls**:

- Consider the impact of zero rolls
- Position pieces to minimize zero roll damage

**Use high rolls efficiently**:

- Use high rolls for finishing, rosettes, or captures
- Don't waste high rolls on simple advancement

### Common Mistakes

**Ignoring rosettes**:

- Rosettes are crucial for safety and extra turns
- Don't overlook their strategic value

**Over-aggression**:

- Don't chase captures at the expense of advancement
- Balance attack and defense

**Poor positioning**:

- Position pieces to create threats and block opponent
- Avoid vulnerable positions

**Not considering opponent's responses**:

- Think ahead about opponent's possible moves
- Plan for counter-attacks

**Wasting high rolls**:

- Use high rolls for maximum impact
- Don't waste them on simple moves

**Missing captures**:

- Look for capture opportunities
- Don't overlook obvious captures

**Inefficient movement**:

- Plan moves to maximize progress
- Avoid unnecessary detours

## AI Opponents

The game features two distinct AI opponents, each with unique playstyles:

### Classic AI (Default)

The **Classic AI** uses the expectiminimax algorithm with evolved genetic parameters:

- **Strategy**: Deep calculation (3-ply search), strong positional play
- **Focus**: Rosettes and safe moves
- **Style**: Can be cautious - aggressive play may exploit this
- **Performance**: See [AI-MATRIX-RESULTS.md](./AI-MATRIX-RESULTS.md) for the latest win rates and speed analysis.

### ML AI (Alternative)

The **ML AI** uses a neural network trained through self-play:

- **Strategy**: Pattern recognition from thousands of games
- **Focus**: Adaptive play based on learned strategies
- **Style**: Different playstyle from Classic AI
- **Performance**: See [AI-MATRIX-RESULTS.md](./AI-MATRIX-RESULTS.md) for the latest win rates and speed analysis.

### AI vs AI Mode

Watch the two AIs play against each other to observe strategic differences. The game proceeds automatically with each AI taking turns until a winner is decided.

## Game Statistics

The game tracks comprehensive statistics:

- **Win/Loss Tracking**: Automatic recording of game outcomes
- **Win Rate Calculation**: Percentage of games won
- **Local Storage**: Statistics persist across browser sessions
- **Database Integration**: Games saved for analytics
- **Real-time Updates**: Statistics update immediately after game completion

## Historical Significance

The Royal Game of Ur provides insights into:

- **Ancient mathematics and probability**: Understanding of dice probabilities
- **Social and cultural insight**: Game played across social classes
- **Strategic thinking**: Evidence of sophisticated strategic thought in early societies

## References and Further Reading

- [Wikipedia: Royal Game of Ur](https://en.wikipedia.org/wiki/Royal_Game_of_Ur) - Comprehensive overview of the ancient board game's history, mechanics, and cultural significance
- [Tom Scott vs Irving Finkel (YouTube)](https://www.youtube.com/watch?v=WZskjLq040I) - British Museum curator teaches the game in an entertaining and accessible way
- [RoyalUr.net: Rules and History](https://royalur.net/learn) - Detailed rules, strategy guides, and historical context
- [Strongly Solving the Royal Game of Ur](https://royalur.net/solved) - In-depth article explaining how AI researchers computed optimal play

## Technical Details

For technical information about the AI implementation, see [AI-SYSTEM.md](./AI-SYSTEM.md). For system architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Summary

The Royal Game of Ur is a fascinating blend of ancient history and modern technology. The game combines strategic depth with accessibility, making it enjoyable for players of all skill levels. The dual AI system provides different challenges and playstyles, while the comprehensive statistics tracking helps players improve their game over time.

The implementation brings this 4500-year-old game to life with cutting-edge web technologies, running entirely in the browser for instant play without network dependencies.
