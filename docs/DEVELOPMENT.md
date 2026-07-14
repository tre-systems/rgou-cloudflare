# Development Guide

Commands, testing, and troubleshooting for the Royal Game of Ur. Prerequisites and first-time setup are in the [README](../README.md#quick-start).

## Everyday commands

```bash
npm run dev          # dev server (http://localhost:3000)
npm run build        # production build
npm run build:cf     # build for Cloudflare (OpenNext)
npm run lint         # lint            (lint:fix to autofix)
npm run lint:rust    # Rust formatting and Clippy with warnings denied
npm run type-check   # TypeScript
npm run check        # lint + type-check + all Rust tests + unit + e2e
npm run nuke         # clean reinstall and restart dev
```

## Build system

```bash
npm run build:wasm-assets   # build the Rust AI to WASM and copy into public/wasm
npm run build:wasm          # WASM only
npm run build:rust-ai       # native Rust build
npm run generate:sw         # service worker (embeds the Git commit hash for cache-busting)
```

## Testing

| Layer                        | Tool                | What to test                 |
| ---------------------------- | ------------------- | ---------------------------- |
| Pure logic (rules, reducers) | Vitest              | High value, low maintenance  |
| Schema / domain types        | Vitest              | Zod schemas and types        |
| Store transitions            | Vitest              | Zustand actions              |
| UI smoke / full game         | Playwright          | Critical flows only          |
| AI behavior & matchups       | Rust (`cargo test`) | Game logic and AI comparison |

UI components are not unit-tested; logic is extracted to `src/lib` and tested there. E2E tests use `data-testid` selectors and verify real database saves.

```bash
npm run test                     # unit tests (Vitest)
npm run test:watch               # watch mode
npm run test:coverage            # with coverage
npm run test:rust                # Rust tests
npm run test:rust:slow           # include depth-4 / slow tests
npm run test:e2e                 # end-to-end (Playwright)
npm run test:e2e:ui              # Playwright UI
npm run test:ai-comparison:fast  # quick AI matrix
```

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

## Database

```bash
npm run db:setup           # set up / reset local SQLite (alias of db:local:reset)
npm run migrate:local      # apply local migrations
npm run migrate:generate   # generate a new migration
npm run migrate:d1         # apply migrations to Cloudflare D1
```

## Troubleshooting

| Symptom                 | Fix                                                                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WASM not loading        | `npm run build:wasm-assets`                                                                                                                                                                  |
| ML AI not working       | `npm run load:ml-weights`, then check `ls public/wasm/`                                                                                                                                      |
| Database errors         | `npm run db:setup`                                                                                                                                                                           |
| E2E failures            | `npx playwright install --with-deps`, then `npm run test:e2e:ui`                                                                                                                             |
| Cloudflare deploy fails | Run `npm ci`, remove `.next`, `.open-next`, and `.wrangler`, then run `npm run build:cf`. Keep the pinned Next, OpenNext, and Wrangler versions in `package.json` aligned with the lockfile. |
| Anything else           | `npm run nuke`                                                                                                                                                                               |

If a WASM build fails, confirm `wasm-pack` is exactly `0.12.1` (`cargo install wasm-pack --version 0.12.1 --locked`), then `cd worker/rust_ai_core && cargo clean` and `npm run build:wasm`.

## Continuous integration

`.github/workflows/deploy.yml` runs `npm run check` on every push and deploys to Cloudflare on success. Run `npm run check` locally before pushing; use `npm run check:slow` to include depth-4 tests.
