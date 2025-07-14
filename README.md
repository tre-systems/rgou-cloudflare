# 🏺 Royal Game of Ur - Cloudflare Edition

A modern implementation of the ancient Mesopotamian board game, "The Royal Game of Ur," built with Next.js, TypeScript, and a dual AI engine in Rust.

This project is a Progressive Web App (PWA) with offline capabilities and a native-like experience.

[![CI/CD](https://github.com/rgilks/rgou-cloudflare/actions/workflows/deploy.yml/badge.svg)](https://github.com/rgilks/rgou-cloudflare/actions/workflows/deploy.yml)

<div align="center">
  <img src="docs/screenshot.png" alt="Royal Game of Ur Screenshot" width="600" />
</div>

<div align="center">
  <a href='https://ko-fi.com/N4N31DPNUS' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi2.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
</div>

## Start Here

- **New to the project?**
  1. Read this README for a quick overview and setup.
  2. See the [Documentation Index](./docs/README.md) for a full guide to all docs.
  3. For rules and strategy, see [Game Rules and Strategy](./docs/game-rules-strategy.md).
  4. For technical setup, see [Technical Implementation Guide](./docs/technical-implementation.md).

## Features

- Authentic gameplay: Faithful recreation of the 4,500-year-old Royal Game of Ur
- Triple AI engine: Client AI (WASM), Server AI (Cloudflare Worker), ML AI (experimental)
- PWA & offline ready
- Modern UI/UX
- Game statistics and database integration

## Game Rules (Summary)

- Roll 4 binary dice (0-4)
- Move pieces along your track
- Land on opponent to capture (except on rosettes)
- Rosettes are safe and grant extra turns
- First to finish all 7 pieces wins

See [Game Rules and Strategy](./docs/game-rules-strategy.md) for details.

## Architecture

- Client AI (WASM, 6-ply, default)
- Server AI (Cloudflare Worker, 4-ply)
- Shared Rust AI core (`worker/rust_ai_core`)
- Expectiminimax algorithm for stochastic games

See [AI System Documentation](./docs/ai-system.md) and [Architecture Overview](./docs/architecture-overview.md).

## Tech Stack

- Next.js, React, TypeScript, Tailwind CSS
- Rust (AI engine, Cloudflare Worker, WASM)
- SQLite (local) / Cloudflare D1 (production)
- Zustand + Immer for state

## Documentation

- [Documentation Index](./docs/README.md)
- [Architecture Overview](./docs/architecture-overview.md)
- [AI System Documentation](./docs/ai-system.md)
- [ML AI System](./docs/ml-ai-system.md)
- [Mac Optimization Guide](./docs/mac-optimization-guide.md)
- [Technical Implementation Guide](./docs/technical-implementation.md)
- [Game Rules and Strategy](./docs/game-rules-strategy.md)
- [Testing Strategy](./docs/testing-strategy.md)

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/downloads)
- [Node.js (v18+)](https://nodejs.org/)
- [Rust & Cargo](https://www.rust-lang.org/tools/install)
- `cargo install wasm-pack`
- `cargo install worker-build`
- [Python 3.8+](https://www.python.org/downloads/) (for ML training)
- `pip install torch torchvision` (for ML training)

### Local Development

```bash
git clone <repository-url>
cd rgou-cloudflare
npm install
npm run migrate:local
npm run dev
```

Game opens at http://localhost:3000.

### ML AI Training (Optional)

```bash
./scripts/train_ml_ai_optimized.sh
# Or
python scripts/train_ml_ai.py --num-games 10000 --epochs 300 --use-rust-ai --output ml_ai_weights.json
```

See [Mac Optimization Guide](./docs/mac-optimization-guide.md) for tuning.

### Preventing Mac Sleep During Training

The training script uses `caffeinate` to prevent sleep. If running manually, prefix with `caffeinate -i`.

### Deploy to Cloudflare

1. `npm install -g wrangler && wrangler login`
2. Create D1 database in Cloudflare dashboard
3. Configure `.env.local` and `wrangler.toml`
4. `npm run migrate:d1 && npm run build && npx wrangler deploy`

### GitHub Actions Deployment

- Add Cloudflare API token and account ID as GitHub secrets
- Push to main branch for auto-deploy

## Testing

```bash
npm run check      # All tests (including Rust)
npm run test       # Unit tests
npm run test:e2e   # E2E tests
./scripts/test_ml_vs_expectiminimax.sh # ML vs expectiminimax AI
```

## Troubleshooting

- **DB errors**: Check migrations and wrangler config
- **Invalid game data**: See browser console
- **WASM issues**: Check CORS headers in `public/_headers`

## License

Open source. See [LICENSE](LICENSE).

## Contributing

- Fork, branch, and make changes
- Run `npm run check` before submitting
- Update docs as needed
- See [Documentation Index](./docs/README.md) for standards

## Resources

- [Royal Game of Ur at the British Museum (object ME 120834)](https://www.britishmuseum.org/collection/object/W_1928-1010-378)
- [Gameboard and Gaming Pieces (Senet and Twenty Squares) at The Metropolitan Museum of Art](https://www.metmuseum.org/art/collection/search/544775)
- [Expedition Magazine: Ur and Its Treasures (Penn Museum)](https://www.penn.museum/sites/expedition/ur-and-its-treasures/)
