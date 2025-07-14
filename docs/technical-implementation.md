# Technical Implementation Guide

## Development Environment Setup

### Prerequisites

- Node.js 18+
- Rust 1.70+
- wasm-pack
- worker-build
- SQLite

### Installation

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack

# Install worker-build
cargo install worker-build

# Install Node.js dependencies
npm install
```

## Project Structure

- `src/`: Next.js frontend
- `worker/`: Rust backend and AI
- `docs/`: Documentation
- `migrations/`: Database schema
- `public/`: Static assets

See [AI System Documentation](./ai-system.md) and [ML AI System](./ml-ai-system.md) for AI details.

## Build Process

### Frontend

```bash
npm run dev      # Development
npm run build    # Production
```

### AI Build

#### WebAssembly (Client AI)

```bash
cd worker/rust_ai_core
wasm-pack build --target web --out-dir ../../public/wasm
```

#### Cloudflare Worker (Server AI)

```bash
cd worker
worker-build --release
```

### Database Migrations

```bash
npm run migrate:local   # Local
npm run migrate:d1      # Production (D1)
```

## AI Implementation

- Rust core: `worker/rust_ai_core/src/lib.rs`
- WASM API: `worker/rust_ai_core/src/wasm_api.rs`
- Frontend: `src/lib/wasm-ai-service.ts`

## Testing

```bash
cd worker/rust_ai_core && cargo test         # Rust tests
npm run test                                 # Unit tests
npm run test:e2e                             # E2E tests
npm run check                                # All tests (including Rust)
```

## Deployment

- Cloudflare Pages (Next.js frontend)
- Cloudflare Worker (AI)
- Cloudflare D1 (database)
- GitHub Actions for CI/CD

### WASM Security Headers

Set in `public/_headers`:

```
/wasm/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
```

## Development vs Production

- Dev: AI diagnostics, toggle, reset/test buttons (localhost only)
- Prod: Clean UI, client AI default

## See Also

- [AI System Documentation](./ai-system.md)
- [ML AI System](./ml-ai-system.md)
- [Architecture Overview](./architecture-overview.md)
- [Testing Strategy](./testing-strategy.md)
