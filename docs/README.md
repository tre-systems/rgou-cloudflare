# Documentation Index

Welcome to the Royal Game of Ur documentation! This guide helps you find everything you need, whether you're a player, developer, or AI researcher.

## Start Here

- **New to the project?**
  1. Read the [Main README](../README.md) for a quick overview and setup.
  2. See [Game Rules and Strategy](./game-rules-strategy.md) for how to play.
  3. For technical setup, see [Technical Implementation Guide](./technical-implementation.md).

- **Just want to play?** The game is available online and works in any modern browser - no installation needed!

## Documentation Overview

- [Architecture Overview](./architecture-overview.md): System design and component interactions
- [AI System Documentation](./ai-system.md): Classic AI (Expectiminimax algorithm) and implementation
- [ML AI System](./ml-ai-system.md): Neural network-based AI, training, and optimization
- [Technical Implementation Guide](./technical-implementation.md): Development setup and build process
- [Game Rules and Strategy](./game-rules-strategy.md): Complete rules and strategy
- [Game Statistics](./game-statistics.md): Statistics tracking system
- [Testing Strategy](./testing-strategy.md): Testing approach and guidelines
- [Mac Optimization Guide](./mac-optimization-guide.md): ML training on Mac

## Quick Reference

- **Players:**
  - [Main README](../README.md): Overview, features, and quick start
  - [Game Rules and Strategy](./game-rules-strategy.md): Complete rules
- **Developers:**
  - [Architecture Overview](./architecture-overview.md): System design
  - [Technical Implementation Guide](./technical-implementation.md): Setup
  - [AI System Documentation](./ai-system.md): Classic AI (Expectiminimax algorithm) details
  - [ML AI System](./ml-ai-system.md): Neural network AI
  - [Testing Strategy](./testing-strategy.md): Testing guidelines
- **AI Researchers:**
  - [AI System Documentation](./ai-system.md): Classic AI (Expectiminimax algorithm)
  - [ML AI System](./ml-ai-system.md): Neural network architecture
  - [Architecture Overview](./architecture-overview.md): System context

## Game Features

- Authentic rules and gameplay
- Two AI opponents:
  - **Classic AI** (Expectiminimax algorithm)
  - **ML AI** (Neural network model)
  - Both run locally in browser
- AI vs. AI watch mode
- PWA support and offline play
- Modern UI
- Database integration (SQLite/D1)

## Game Result Saving

At the end of each game, the following fields are saved to the database:

- **playerId**: A unique, persistent ID generated and stored in the browser/app localStorage. This allows tracking the same player across multiple games in the same browser/app, without requiring login. If localStorage is cleared, a new ID is generated.
- **winner**: The winner of the game ('player1' or 'player2').
- **completedAt**: Timestamp when the game finished.
- **moveCount**: Number of moves in the game.
- **duration**: Total time (ms) from game start to finish.
- **clientHeader**: The browser's user agent string (or 'unknown' if not available).
- **history**: Full move history (as JSON).
- **gameType**: Always 'standard' (for now).

### Player Tracking

- The `playerId` is generated and stored in localStorage as `rgou-player-id`.
- This ID persists across games and browser sessions, unless localStorage is cleared.
- No login or authentication is required.

## Related Resources

- [Irving Finkel, "On the Rules for the Royal Game of Ur" (PDF)](https://www.academia.edu/15173145/On_the_Rules_for_the_Royal_Game_of_Ur)
- [RoyalUr.net: Rules and History](https://royalur.net/learn)
- [Wikipedia: Royal Game of Ur](https://en.wikipedia.org/wiki/Royal_Game_of_Ur)
- [Russell & Norvig, "Artificial Intelligence: A Modern Approach"](https://aima.cs.berkeley.edu/)

## Contributing

- Improve technical details
- Update code examples
- Add or update references
- Enhance diagrams
- Follow the [Technical Implementation Guide](./technical-implementation.md)
- Run all tests before submitting
- Update relevant documentation

## Documentation Standards

- Clear structure and headings
- Code examples where relevant
- Cross-references between docs
- Cite sources and provide references
- Keep docs up to date with code

## Getting Help

- **WASM Loading:** Check CORS headers and file paths
- **AI Performance:** Monitor search depth and memory usage
- **Database Issues:** Verify environment variables and migrations
- **Build Problems:** Ensure all prerequisites are installed
- **Support:**
  - GitHub Issues
  - This documentation
  - Community
