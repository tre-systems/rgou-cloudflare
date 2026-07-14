# Royal Game of Ur

[![CI/CD](https://github.com/tre-systems/rgou-cloudflare/actions/workflows/deploy.yml/badge.svg)](https://github.com/tre-systems/rgou-cloudflare/actions/workflows/deploy.yml)

<div align="center">
  <img src="docs/screenshot.png" alt="Royal Game of Ur AI match in progress" width="408" />
  <br />
  <a href='https://ko-fi.com/N4N31DPNUS' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi2.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
  <hr />
</div>

An offline-first implementation of the ancient Royal Game of Ur (c. 2500 BCE) with Classic and machine-learning opponents. The React interface runs both Rust/WebAssembly AIs locally in one lazy Web Worker and deploys as a Cloudflare Worker with Static Assets.

## Play Now

**[gameofur.org](https://gameofur.org/)** — works in any modern browser, no installation required.

## Features

- **Dual AI**: classic expectiminimax and a self-trained neural network, both running locally through Rust and WebAssembly
- **Non-blocking play**: one lazily created Web Worker hosts every AI engine, keeping search, inference, and model loading off the UI thread
- **Offline-first**: HTML plus its hashed JS/CSS shell are installed atomically while larger AI assets are cached opportunistically
- **Responsive UI**: animations and sound effects on desktop and mobile
- **Private by design**: win/loss statistics stay on the device; anonymous aggregate game lifecycle counts are sent to Cloudflare Analytics Engine when online

## Quick Start

### Prerequisites

- **Node.js 22+** ([download](https://nodejs.org/))
- **Rust & Cargo** ([install](https://www.rust-lang.org/tools/install)) — compiles the AI to WebAssembly
- **wasm-pack**: `cargo install wasm-pack --version 0.12.1 --locked`

> Developed on Apple Silicon. It runs on other platforms, but ML training is tuned for Apple Silicon (see [AI-SYSTEM.md](./docs/AI-SYSTEM.md)).

### Setup

```bash
git clone https://github.com/tre-systems/rgou-cloudflare.git
cd rgou-cloudflare
npm install
npm run build:wasm-assets   # compile the Rust AI to WASM (required)
npm run dev
```

The game opens at the local URL printed by Vite (normally http://localhost:5173).

## AI System

Two opponents, both running entirely in the browser through one typed Worker boundary:

- **Classic AI** (default): expectiminimax search with alpha-beta pruning and evolved genetic parameters.
- **ML AI**: a value + policy neural network trained through self-play.

See [AI-SYSTEM.md](./docs/AI-SYSTEM.md) for the algorithms, models, and training, and [AI-MATRIX-RESULTS.md](./docs/AI-MATRIX-RESULTS.md) for win rates and speed.

## Testing

```bash
npm run check                    # lint, diagrams, type-check, Rust AI matrix, unit + e2e tests
npm run test                     # unit tests (Vitest)
npm run test:e2e                 # end-to-end tests (Playwright)
npm run test:ai-comparison:fast  # quick AI comparison
```

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for the full command reference and troubleshooting.

## Documentation

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — system design, pattern catalogue, dependency rules, data flow, and deployment
- **[Architecture diagrams](./docs/diagrams/README.md)** — Graphviz sources, rendered system views, and visual conventions
- **[AI-SYSTEM.md](./docs/AI-SYSTEM.md)** — Classic AI, ML AI, training, and genetic evolution
- **[AI-MATRIX-RESULTS.md](./docs/AI-MATRIX-RESULTS.md)** — generated AI win-rate and speed results
- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** — commands, testing, and troubleshooting
- **[GAME-GUIDE.md](./docs/GAME-GUIDE.md)** — rules, strategy, and history
- **[TODO.md](./docs/TODO.md)** — roadmap
- **[ml/README.md](./ml/README.md)** — ML training quick start
- **[worker/rust_ai_core/tests/README.md](./worker/rust_ai_core/tests/README.md)** — Rust test suite

## Architecture

![System overview](docs/diagrams/system-overview.png)

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, Framer Motion, Zustand
- **State**: canonical local persistence with board, status, winner, and legal-move projections rebuilt on hydration
- **AI engine**: Rust compiled to WebAssembly in one lazy Web Worker; requests carry only a narrow `AIPosition`
- **Analytics**: anonymous, short-retention lifecycle counters in the shared Cloudflare Analytics Engine `app_usage` dataset; no database
- **Deployment**: Cloudflare Worker + Static Assets, serialized and release-verified by GitHub Actions

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for details.

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

- **Irving Finkel** — British Museum curator who reconstructed the rules
- **[RoyalUr.net](https://royalur.net/)** — game analysis and strategy
- The Rust and WebAssembly communities
