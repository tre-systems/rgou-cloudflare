# Royal Game of Ur

[![CI/CD](https://github.com/rgilks/rgou-cloudflare/actions/workflows/deploy.yml/badge.svg)](https://github.com/rgilks/rgou-cloudflare/actions/workflows/deploy.yml)

<div align="center">
  <img src="docs/screenshot.png" alt="rgou Screenshot" width="408" />
  <br />
  <a href='https://ko-fi.com/N4N31DPNUS' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi2.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
  <hr />
</div>

A modern web implementation of the ancient Royal Game of Ur (c. 2500 BCE) with dual AI opponents, offline play, and animations. Built with Next.js, TypeScript, Rust, and WebAssembly.

## Play Now

**[rgou.tre.systems](https://rgou.tre.systems/)** — works in any modern browser, no installation required.

## Features

- **Dual AI**: classic expectiminimax and a self-trained neural network, both running locally via WebAssembly
- **Offline-first**: a PWA that is fully playable without a connection
- **Responsive UI**: animations and sound effects on desktop and mobile
- **Statistics**: win/loss tracking persisted locally and saved to the database

## Quick Start

### Prerequisites

- **Node.js 22+** ([download](https://nodejs.org/))
- **Rust & Cargo** ([install](https://www.rust-lang.org/tools/install)) — compiles the AI to WebAssembly
- **wasm-pack**: `cargo install wasm-pack --version 0.12.1 --locked`

> Developed on Apple Silicon. It runs on other platforms, but ML training is tuned for Apple Silicon (see [AI-SYSTEM.md](./docs/AI-SYSTEM.md)).

### Setup

```bash
git clone https://github.com/rgilks/rgou-cloudflare.git
cd rgou-cloudflare
npm install
npm run db:setup            # local SQLite database
npm run build:wasm-assets   # compile the Rust AI to WASM (required)
npm run dev
```

The game opens at http://localhost:3000.

## AI System

Two opponents, both running entirely in the browser:

- **Classic AI** (default): expectiminimax search with alpha-beta pruning and evolved genetic parameters.
- **ML AI**: a value + policy neural network trained through self-play.

See [AI-SYSTEM.md](./docs/AI-SYSTEM.md) for the algorithms, models, and training, and [AI-MATRIX-RESULTS.md](./docs/AI-MATRIX-RESULTS.md) for win rates and speed.

## Testing

```bash
npm run check                    # lint, type-check, Rust AI matrix, unit + e2e tests
npm run test                     # unit tests (Vitest)
npm run test:e2e                 # end-to-end tests (Playwright)
npm run test:ai-comparison:fast  # quick AI comparison
```

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for the full command reference and troubleshooting.

## Documentation

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — system design, data flow, database, and deployment
- **[AI-SYSTEM.md](./docs/AI-SYSTEM.md)** — Classic AI, ML AI, training, and genetic evolution
- **[AI-MATRIX-RESULTS.md](./docs/AI-MATRIX-RESULTS.md)** — generated AI win-rate and speed results
- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** — commands, testing, and troubleshooting
- **[GAME-GUIDE.md](./docs/GAME-GUIDE.md)** — rules, strategy, and history
- **[TODO.md](./docs/TODO.md)** — roadmap
- **[ml/README.md](./ml/README.md)** — ML training quick start
- **[worker/rust_ai_core/tests/README.md](./worker/rust_ai_core/tests/README.md)** — Rust test suite

## Architecture

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Framer Motion, Zustand
- **AI engine**: Rust compiled to WebAssembly, running in Web Workers
- **Database**: Cloudflare D1 (production), SQLite (development), Drizzle ORM
- **Deployment**: Cloudflare Workers via OpenNext, deployed by GitHub Actions

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for details.

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

- **Irving Finkel** — British Museum curator who reconstructed the rules
- **[RoyalUr.net](https://royalur.net/)** — game analysis and strategy
- The Rust and WebAssembly communities
