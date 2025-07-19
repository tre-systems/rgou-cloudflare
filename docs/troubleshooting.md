# Troubleshooting Guide

This document covers common issues and their solutions for the Royal Game of Ur project.

## Cloudflare Deployment Issues

### "Failed to prepare server Error: An error occurred while loading the instrumentation hook"

**Problem:** Application works locally but fails on Cloudflare with instrumentation hook errors.

**Error Message:**

```
{
  "message": "Server failed to respond.",
  "details": {}
}
```

**Cloudflare Logs:**

```
Failed to prepare server Error: An error occurred while loading the instrumentation hook
```

**Root Cause:**

- Next.js 15.4.2+ introduced instrumentation hooks that aren't compatible with Cloudflare Workers
- Version mismatch between local environment and GitHub Actions environment
- The caret (`^`) in package.json allows compatible updates that break Cloudflare deployment

**Solution:**

1. Pin the exact dependency versions that work with Cloudflare Workers:

   ```bash
   npm install --save-exact next@15.3.4 @opennextjs/cloudflare@1.3.1 wrangler@4.22.0
   ```

2. Clean build artifacts:

   ```bash
   rm -rf .next .open-next .wrangler
   ```

3. Rebuild and deploy:

   ```bash
   npm run build:cf
   npx wrangler deploy --config wrangler.toml --env=""
   ```

4. Commit the changes to prevent future version drift:
   ```bash
   git add package.json package-lock.json
   git commit -m "Pin dependency versions to fix Cloudflare deployment issues"
   git push
   ```

**Prevention:**

- Always use exact versions (without `^`) for critical dependencies
- Test both local and GitHub Actions deployments after dependency updates
- If you need to update dependencies, test thoroughly on Cloudflare first
- Monitor Cloudflare logs for instrumentation hook errors

**Affected Dependencies:**

- `next`: Must stay at 15.3.4 or lower
- `@opennextjs/cloudflare`: Must stay at 1.3.1 or lower
- `wrangler`: Must stay at 4.22.0 or lower

## Build Issues

### WASM Build Failures

**Problem:** `wasm-pack build` fails or produces incorrect output.

**Solution:**

1. Ensure you have the correct wasm-pack version:

   ```bash
   cargo install wasm-pack --version 0.12.1 --locked
   ```

2. Clean and rebuild:
   ```bash
   cd worker/rust_ai_core
   cargo clean
   wasm-pack build --target web --out-name rgou_ai_worker -- --features wasm
   ```

### TypeScript Compilation Errors

**Problem:** TypeScript compilation fails during build.

**Solution:**

1. Run type checking:

   ```bash
   npm run type-check
   ```

2. Fix any type errors in the codebase
3. Ensure all dependencies are properly installed:
   ```bash
   npm install
   ```

## Runtime Issues

### ML AI Not Working

**Problem:** ML AI fails to load or make moves.

**Solution:**

1. Check if WASM files are properly built and copied:

   ```bash
   ls -la public/wasm/
   ```

2. Ensure weights are loaded:

   ```bash
   npm run load:ml-weights
   ```

3. Check browser console for WASM loading errors

### Database Connection Issues

**Problem:** Database operations fail.

**Solution:**

1. For local development:

   ```bash
   npm run migrate:local
   ```

2. For production:

   ```bash
   npm run migrate:d1
   ```

3. Check environment variables are set correctly

## Testing Issues

### E2E Tests Failing

**Problem:** Playwright tests fail locally or in CI.

**Solution:**

1. Install Playwright browsers:

   ```bash
   npx playwright install --with-deps
   ```

2. Run tests with UI for debugging:

   ```bash
   npm run test:e2e:ui
   ```

3. Check if local database is running for E2E tests

### Unit Tests Failing

**Problem:** Vitest tests fail.

**Solution:**

1. Run tests with coverage to see detailed output:

   ```bash
   npm run test:coverage
   ```

2. Check for missing dependencies or configuration issues

## Performance Issues

### Slow Build Times

**Problem:** Build process takes too long.

**Solution:**

1. Use caching for dependencies:

   ```bash
   npm ci
   ```

2. Clean unnecessary files:
   ```bash
   npm run nuke
   ```

### Large Bundle Size

**Problem:** Application bundle is too large.

**Solution:**

1. Check bundle analysis:

   ```bash
   npm run build
   ```

2. Look for large dependencies that can be optimized
3. Consider code splitting for large components

## Common Commands

### Reset Everything

```bash
npm run nuke
```

### Full Test Suite

```bash
npm run check
```

### Local Development

```bash
npm run dev
```

### Production Build

```bash
npm run build:cf
```

### Deploy to Cloudflare

```bash
npx wrangler deploy --config wrangler.toml --env=""
```

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/rgilks/rgou-cloudflare/issues)
2. Review the [Architecture Overview](./architecture-overview.md)
3. Check the [Technical Implementation](./technical-implementation.md)
4. Look at the [Testing Strategy](./testing-strategy.md)

For Cloudflare-specific issues, refer to the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/).
