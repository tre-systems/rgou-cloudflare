# Development Guide

Commands, testing, and troubleshooting for the Royal Game of Ur. Prerequisites and first-time setup are in the [README](../README.md#quick-start).

## Everyday commands

```bash
npm run dev          # dev server (normally http://localhost:5173)
npm run build        # production build
npm run preview      # serve the production build locally
npm run deploy       # build and deploy with Wrangler
npm run smoke:production # verify assets, validation, release identity, and every canonical redirect
npm run lint         # lint            (lint:fix to autofix)
npm run lint:rust    # Rust formatting and Clippy with warnings denied
npm run type-check   # TypeScript
npm run check        # lint + diagrams + type-check + all Rust tests + unit + e2e
npm run nuke         # clean reinstall and restart dev
```

## Build system

```bash
npm run build:wasm-assets   # build the Rust AI to WASM and copy into public/wasm
npm run build:wasm          # WASM only
npm run build:rust-ai       # native Rust build
npm run generate:sw         # service worker (embeds the Git commit hash for cache-busting)
```

## Architecture diagrams

Graphviz/DOT sources are authoritative and rendered PNGs are committed for GitHub. Install Graphviz with `brew install graphviz`, then run:

```bash
npm run diagrams          # refresh every PNG from its DOT source
npm run check:diagrams    # verify all sources render and committed PNGs exist
```

See [docs/diagrams/README.md](./diagrams/README.md) for the diagram catalogue, reading order, and shared conventions. CI installs Graphviz and validates diagrams through `npm run check`.

## Testing

| Layer                        | Tool                | What to test                            |
| ---------------------------- | ------------------- | --------------------------------------- |
| Pure logic (rules, reducers) | Vitest              | High value, low maintenance             |
| Schema / domain types        | Vitest              | Zod schemas and types                   |
| Store transitions            | Vitest              | Zustand actions                         |
| UI smoke / full game         | Playwright          | Critical flows only                     |
| AI behavior & matchups       | Rust (`cargo test`) | Game logic and AI comparison            |
| TS/Rust rule parity          | Vitest + Rust       | Shared conformance fixtures             |
| Service Worker contracts     | Node test runner    | Required and optional precache behavior |
| Production smoke contracts   | Node test runner    | Configured canonical-host redirects     |

UI components are not unit-tested; logic is extracted to `src/lib` and tested there. E2E tests use `data-testid` selectors and verify the built app and anonymous usage lifecycle.

Architectural invariants are documented in the [pattern catalogue](./ARCHITECTURE.md#pattern-catalogue). In particular, add unit tests for pure policies and boundary parsers, and use Playwright for rendered component behavior.

```bash
npm run test                     # unit tests (Vitest)
npm run test:watch               # watch mode
npm run test:coverage            # with coverage
npm run test:rust                # Rust tests
npm run test:service-worker      # required/optional offline precache contract
npm run test:smoke-production    # configured alias discovery and redirect contract
npm run test:model-provenance    # production model, deployment, and training-input hashes
npm run test:rust:slow           # include depth-4 / slow tests
npm run test:e2e                 # end-to-end (Playwright)
npm run test:e2e:ui              # Playwright UI
npm run test:ai-comparison:fast  # quick AI matrix
```

The two rule implementations share `test-fixtures/rules-conformance.json`. Every rule change must update or extend this corpus and pass both `src/lib/__tests__/rules-conformance.test.ts` and `worker/rust_ai_core/tests/rules_conformance.rs`. Use injected `RandomSource` values or explicit dice rolls when a test must be reproducible.

## Machine learning

Training presets (`quick`, `default`, `production`) and the network architecture are described in [AI-SYSTEM.md](./AI-SYSTEM.md).

```bash
# PyTorch backend (needs a GPU: CUDA or Apple Metal)
npm run train:pytorch
npm run train:pytorch:quick
npm run train:pytorch:production

# Rust backend (CPU, always available)
npm run train:rust
npm run train:rust:quick
npm run train:rust:production

# Custom parameters
./ml/scripts/train.sh --backend rust --num-games 500 --epochs 25

# Genetic parameters for the Classic AI
npm run evolve:genetic-params
npm run validate:genetic-params

# Convert/publish trained weights
npm run load:ml-weights
```

Rust self-play derives each game's random stream from the configured seed and game index. Parallel scheduling and core allocation therefore do not change the generated corpus or its game order. This guarantee applies to CPU data generation; GPU training can still vary across hardware.

## Usage analytics

The browser reports validated `game_started` and `game_completed` events to the same-origin `/api/usage` Worker endpoint. Development does not require a database. In production the optional `APP_USAGE` binding writes anonymous counters to the account-level `app_usage` Analytics Engine dataset; reporting failures never interrupt play. Analytics Engine retention is three months, by design: these counters are aggregate operational telemetry rather than historical records.

## Troubleshooting

| Symptom                 | Fix                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| WASM not loading        | `npm run build:wasm-assets`                                                                                               |
| ML AI not working       | `npm run load:ml-weights`, then check `ls public/wasm/`                                                                   |
| E2E failures            | `npx playwright install --with-deps`, then `npm run test:e2e:ui`                                                          |
| Diagram rendering fails | Install Graphviz with `brew install graphviz`, then run `npm run diagrams`                                                |
| Cloudflare deploy fails | Run `npm ci`, remove `out` and `.wrangler`, then run `npm run build`. Deploy the generated `out/rgou_main/wrangler.json`. |
| Anything else           | `npm run nuke`                                                                                                            |

If a WASM build fails, confirm `wasm-pack` is exactly `0.12.1` (`cargo install wasm-pack --version 0.12.1 --locked`), then `cd worker/rust_ai_core && cargo clean` and `npm run build:wasm`.

## Continuous integration

`.github/workflows/deploy.yml` serializes work by ref, restores locked Node and Rust dependencies, runs `npm audit` and `cargo audit`, runs `npm run check`, builds the Vite/Worker artifact, deploys it on `main`, and smoke-tests production. The build embeds the full Git SHA; `/healthz` returns it in both JSON and `X-App-Release`, and the smoke test rejects a different release. The same smoke run verifies that `www.gameofur.org`, `gameofur.net`, `www.gameofur.net`, and `rgou.tre.systems` permanently redirect to `https://gameofur.org` without losing the path or query. Run `npm run check` locally before pushing; use `npm run check:slow` to include depth-4 tests.

`Cargo.lock` and `rust-toolchain.toml` are committed application inputs. Update them intentionally when changing Rust dependencies or the compiler; do not regenerate them incidentally in CI.
