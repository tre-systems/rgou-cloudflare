# Documentation Index

Welcome to the Royal Game of Ur documentation! This guide will help you find the information you need.

## 📖 Documentation Overview

The Royal Game of Ur is a modern implementation of the ancient Mesopotamian board game, featuring a sophisticated dual-AI engine and comprehensive documentation.

## 🎯 For Players

### Getting Started

- **[Main README](../README.md)**: Overview, features, and quick start guide
- **[Game Rules and Strategy](./game-rules-strategy.md)**: Complete rules and strategic guidance

### Understanding the AI

- **[AI System Documentation](./ai-system.md)**: How the AI works, algorithms, and technical details
- **AI Diagnostics Panel**: Available in development mode for real-time AI analysis

## 🛠️ For Developers

### Architecture & Implementation

- **[Architecture Overview](./architecture-overview.md)**: System design and component interactions
- **[Technical Implementation Guide](./technical-implementation.md)**: Development setup and build process

### AI Development

- **[AI System Documentation](./ai-system.md)**: Algorithm details, evaluation function, and optimization techniques
- **Rust AI Core**: `worker/rust_ai_core/src/lib.rs` - Core AI logic
- **WebAssembly API**: `worker/rust_ai_core/src/wasm_api.rs` - WASM interface
- **Worker Implementation**: `worker/src/lib.rs` - Cloudflare Worker

### Database & State Management

- **[Game Statistics](./game-statistics.md)**: Statistics tracking system implementation
- **Database Schema**: `src/lib/db/schema.ts` - Drizzle ORM schema
- **State Management**: `src/lib/game-store.ts` - Zustand store with Immer

## 📚 Documentation Structure

```
docs/
├── README.md                    # This index file
├── architecture-overview.md     # System architecture
├── ai-system.md                # AI algorithm and implementation
├── technical-implementation.md  # Development guide
├── game-rules-strategy.md      # Game rules and strategy
├── game-statistics.md          # Statistics system
└── testing-strategy.md         # Testing strategy and guidelines
```

## 🔍 Quick Reference

### For New Players

1. Read the **[Main README](../README.md)** for an overview
2. Check **[Game Rules and Strategy](./game-rules-strategy.md)** for complete rules
3. Start playing and explore the AI behavior

### For Developers

1. Review **[Architecture Overview](./architecture-overview.md)** for system design
2. Read **[Technical Implementation Guide](./technical-implementation.md)** for setup
3. Study **[AI System Documentation](./ai-system.md)** for AI implementation details
4. Follow **[Testing Strategy](./testing-strategy.md)** for testing guidelines

### For AI Researchers

1. Focus on **[AI System Documentation](./ai-system.md)** for algorithm details
2. Review the academic references and mathematical foundations
3. Examine the Rust implementation in `worker/rust_ai_core/`

## 🎮 Game Features

### Core Gameplay

- **Authentic Rules**: Faithful recreation of the 4,500-year-old game
- **Dual AI Engine**: Client-side WASM AI (default) and server-side Worker AI
- **PWA Support**: Installable Progressive Web App with offline capability
- **Modern UI**: Beautiful, responsive interface with animations

### AI Capabilities

- **Expectiminimax Algorithm**: Advanced game theory for stochastic games
- **6-Ply Search Depth**: Deep strategic analysis for client AI
- **Position Evaluation**: Sophisticated scoring system
- **Transposition Tables**: Efficient position caching
- **Quiescence Search**: Horizon effect prevention

### Technical Features

- **Rust Implementation**: High-performance AI engine
- **WebAssembly**: Near-native performance in browsers
- **Cloudflare Workers**: Serverless AI deployment
- **TypeScript**: Type-safe frontend development
- **Zustand + Immer**: Efficient state management
- **Database Integration**: SQLite (local) / D1 (production)

## 🔗 Related Resources

### Academic References

- **Game Theory**: Russell & Norvig (2021) - AI: A Modern Approach
- **Expectiminimax**: Ballard (1983) - \*-minimax search procedure
- **Historical Context**: Finkel (2007) - Rules for the Royal Game of Ur

### Online Resources

- **British Museum**: [Original game artifacts](https://www.britishmuseum.org/collection/object/W_1928-1010-378)
- **Metropolitan Museum**: [Historical game pieces](https://www.metmuseum.org/art/collection/search/329072)
- **University of Pennsylvania**: [Archaeological findings](https://www.penn.museum/collections/object/30-12-702)

### Code Repositories

- **Frontend**: Next.js application in `src/`
- **AI Engine**: Rust implementation in `worker/`
- **Database**: Drizzle ORM with D1/SQLite support

## 🤝 Contributing

### Documentation Improvements

- Add missing technical details
- Improve code examples
- Update academic references
- Enhance diagrams and visualizations

### Code Contributions

- Follow the technical implementation guide
- Run all tests before submitting
- Update relevant documentation
- Maintain code quality standards

## 📝 Documentation Standards

### Writing Guidelines

- **Clear Structure**: Use consistent headings and organization
- **Code Examples**: Include relevant code snippets
- **Cross-References**: Link between related documents
- **Academic Rigor**: Cite sources and provide references

### Maintenance

- **Keep Updated**: Documentation should reflect current implementation
- **Version Control**: Track documentation changes with code
- **Review Process**: Regular documentation reviews
- **User Feedback**: Incorporate user suggestions and questions

## 🆘 Getting Help

### Common Issues

- **WASM Loading**: Check CORS headers and file paths
- **AI Performance**: Monitor search depth and memory usage
- **Database Issues**: Verify environment variables and migrations
- **Build Problems**: Ensure all prerequisites are installed

### Support Channels

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check relevant documentation sections
- **Code Comments**: Review inline code documentation
- **Community**: Engage with other developers and players
