# Troubleshooting Guide

_Common issues and solutions for the Royal Game of Ur project._

## Cloudflare Deployment Issues

### Instrumentation Hook Error

**Problem:** App works locally but fails on Cloudflare.

**Solution:**

```bash
# Pin exact dependency versions
npm install --save-exact next@15.3.4 @opennextjs/cloudflare@1.3.1 wrangler@4.22.0

# Clean and rebuild
rm -rf .next .open-next .wrangler
npm run build:cf
```

**Prevention:** Always use exact versions for critical dependencies.

## Build Issues

### WASM Build Failures

**Solution:**

```bash
# Install correct wasm-pack version
cargo install wasm-pack --version 0.12.1 --locked

# Clean and rebuild
cd worker/rust_ai_core
cargo clean
wasm-pack build --target web --out-name rgou_ai_worker -- --features wasm
```

### TypeScript Errors

**Solution:**

```bash
npm run type-check
npm install
```

## Runtime Issues

### ML AI Not Working

**Solution:**

```bash
# Check WASM files
ls -la public/wasm/

# Load weights
npm run load:ml-weights
```

### Database Issues

**Solution:**

```bash
# Local development
npm run migrate:local

# Production
npm run migrate:d1
```

## Testing Issues

### E2E Tests Failing

**Solution:**

```bash
# Install Playwright browsers
npx playwright install --with-deps

# Run with UI for debugging
npm run test:e2e:ui
```

### Unit Tests Failing

**Solution:**

```bash
npm run test:coverage
npm install
```

## Performance Issues

### Slow Build Times

**Solution:**

```bash
# Use caching
npm ci --cache .npm

# Clean and rebuild
npm run nuke
```

### ML Training Issues

**Solution:**

```bash
# Ensure GPU available
python -c "import torch; print(torch.cuda.is_available())"

# Use reuse flag for faster iteration
python ml/scripts/train_ml_ai_version.py --version v2 --reuse-games
```

## Common Commands

### Reset Environment

```bash
npm run nuke
```

### Build WASM Assets

```bash
npm run build:wasm-assets
```

### Check All Tests

```bash
npm run check
```

### Run Slow Tests

```bash
npm run check:slow
```

## Quick Fixes

| Issue            | Quick Fix                   |
| ---------------- | --------------------------- |
| WASM not loading | `npm run build:wasm-assets` |
| Database errors  | `npm run migrate:local`     |
| ML AI broken     | `npm run load:ml-weights`   |
| Tests failing    | `npm run nuke`              |
| Build slow       | `npm ci --cache .npm`       |
| Deployment fails | Pin dependency versions     |

## Related Documentation

- [Testing Strategy](./testing-strategy.md) - Testing approach
- [Test Configuration Guide](./test-configuration-guide.md) - Test setup
- [Architecture Overview](./architecture-overview.md) - System design
