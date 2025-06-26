# 🚀 Deployment Guide - Royal Game of Ur

This guide walks you through deploying the Royal Game of Ur using Cloudflare Workers with static assets for the frontend and Cloudflare Workers for the AI backend.

## Prerequisites

- [Cloudflare account](https://cloudflare.com)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Node.js 18+ and npm
- Rust and Cargo (for AI worker development)
- Git repository (GitHub, GitLab, etc.)

## 📋 Setup Checklist

### 1. Cloudflare Account Setup

- [ ] Create/login to Cloudflare account
- [ ] Note your Account ID (found in right sidebar of dashboard)
- [ ] Create API token with appropriate permissions

### 2. Install Required Tools

```bash
# Install Wrangler CLI
npm install -g wrangler
wrangler auth login

# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install worker-build tool
cargo install worker-build
```

### 3. Configure Environment Variables

Create environment variables for your deployment:

**Local Development:**
Create `.env.local` in project root:

```bash
NEXT_PUBLIC_AI_WORKER_URL=http://localhost:8787
```

**Production:**
Set in `wrangler.toml` or via Wrangler CLI:

```bash
NEXT_PUBLIC_AI_WORKER_URL=https://your-worker.your-subdomain.workers.dev
```

## 🤖 Deploy AI Worker First

### 1. Configure Worker

Edit `worker/wrangler.toml`:

```toml
name = "rgou-ai-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"
account_id = "your-account-id-here"

# Uncomment for production
workers_dev = true
```

### 2. Build and Deploy Worker

```bash
cd worker

# Install dependencies and build
npm install

# Build Rust worker
cargo build --release

# Deploy to Cloudflare Workers
wrangler deploy
```

### 3. Note Worker URL

After deployment, note the worker URL (e.g., `https://rgou-ai-worker.your-subdomain.workers.dev`)

## 🌐 Deploy Frontend to Cloudflare Workers

### Main Deployment Method

The project now uses Cloudflare Workers with static assets instead of Cloudflare Pages.

1. **Configure wrangler.toml:**

   Update the main `wrangler.toml` file:

   ```toml
   name = "rgou-main"
   main = "worker.js"
   compatibility_date = "2025-06-14"
   account_id = "your-account-id-here"
   workers_dev = true

   [assets]
   directory = "./out"
   binding = "ASSETS"

   [vars]
   ENVIRONMENT = "production"
   NEXT_PUBLIC_AI_WORKER_URL = "https://your-ai-worker-url.workers.dev"

   # Custom domain configuration (optional)
   [[routes]]
   pattern = "yourdomain.com/*"
   zone_name = "yourdomain.com"
   ```

2. **Build and Deploy:**

   ```bash
   # Build the application
   npm run build:cf

   # Deploy to Cloudflare Workers
   npm run deploy:cf
   ```

### Alternative: Manual Deployment

1. **Build locally:**

   ```bash
   NEXT_PUBLIC_AI_WORKER_URL=https://your-worker-url.workers.dev npm run build:cf
   ```

2. **Deploy with Wrangler:**
   ```bash
   wrangler deploy
   ```

## 🔧 Configuration Details

### Worker Configuration

**wrangler.toml key settings:**

```toml
name = "rgou-main"
main = "worker.js"
compatibility_date = "2025-06-14"
compatibility_flags = [ "nodejs_compat" ]

[assets]
directory = "./out"
binding = "ASSETS"

[vars]
ENVIRONMENT = "production"
NEXT_PUBLIC_AI_WORKER_URL = "https://your-ai-worker-url.workers.dev"

# Route configuration (optional)
[[routes]]
pattern = "api.yourdomain.com/*"
zone_name = "yourdomain.com"
```

### Next.js Configuration

**next.config.ts settings:**

```typescript
const nextConfig: NextConfig = {
  experimental: {
    runtime: "edge", // Edge runtime for Cloudflare
  },
  output: "export", // Static export for Workers
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: "out", // Output directory for static assets
  images: {
    unoptimized: true, // Required for static export
  },
};
```

## 🧪 Deployment Verification

### 1. Test AI Worker

```bash
curl https://your-worker-url.workers.dev/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### 2. Test Frontend

- Visit your Worker URL
- Try both game modes (human vs human, human vs AI)
- Verify AI moves are working
- Check browser dev tools for any errors

## 🔄 CI/CD Setup

### GitHub Actions Example

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build:cf
        env:
          NEXT_PUBLIC_AI_WORKER_URL: ${{ secrets.AI_WORKER_URL }}

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

## 📝 Environment Variables

### Required Variables

- `NEXT_PUBLIC_AI_WORKER_URL`: URL of your AI worker
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN`: API token for deployment

### Optional Variables

- `AI_WORKER_SECRET`: Secret for worker-to-worker communication
- `ENVIRONMENT`: Environment identifier (production, staging, etc.)

## 🚨 Troubleshooting

### Common Issues

1. **Assets not loading**: Check that the `[assets]` binding is configured correctly
2. **AI worker not responding**: Ensure the AI worker is deployed and the URL is correct
3. **Build failures**: Check that all dependencies are installed and build scripts work locally
4. **CORS errors**: Verify that the AI worker has proper CORS headers

### Debug Commands

```bash
# Check worker status
wrangler whoami

# View worker logs
wrangler tail

# Test locally
npm run dev
npm run dev:worker
```

### Performance Optimization

- Use custom domains for better performance
- Enable compression for static assets
- Monitor worker performance through Cloudflare Analytics
- Consider using Cloudflare's caching features

## 🎯 Next Steps

After successful deployment:

1. Set up monitoring and alerting
2. Configure custom domains
3. Monitor performance metrics
4. Plan for scaling if needed

For more detailed information about specific configurations, see the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/).
