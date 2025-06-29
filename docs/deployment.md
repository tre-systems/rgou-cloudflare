# 🚀 Deployment Guide - Royal Game of Ur

This guide walks you through deploying the Royal Game of Ur to Cloudflare. The frontend is a Next.js application adapted for Cloudflare using **OpenNext**, and the AI backend is a distinct Rust-based Cloudflare Worker.

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

## 🤖 Step 1: Deploy the AI Worker

First, deploy the Rust-based AI worker that will serve as the "Server AI" opponent.

### 1. Configure AI Worker

Navigate to the worker directory and edit `worker/wrangler.toml`:

```toml
# worker/wrangler.toml
name = "rgou-ai-worker" # Choose a unique name
main = "build/worker/shim.mjs"
compatibility_date = "2024-04-05"
account_id = "<YOUR_ACCOUNT_ID>"

[build]
command = "npm run build"
```

### 2. Deploy the Worker

From the `worker/` directory, run the deployment command:

```bash
# In ./worker/ directory
wrangler deploy
```

After deployment, Cloudflare will provide a URL for your worker (e.g., `https://rgou-ai-worker.your-subdomain.workers.dev`). **Copy this URL.**

## 🌐 Step 2: Deploy the Next.js Frontend

The frontend is a Next.js application built and deployed as a separate Cloudflare Worker using OpenNext.

### 1. Configure Frontend Worker

Update the main `wrangler.toml` file in the project root with your details and the AI worker URL from the previous step.

```toml
# ./wrangler.toml
name = "rgou-main"
main = ".open-next/worker.js"
compatibility_date = "2024-01-01"
account_id = "<YOUR_ACCOUNT_ID>"

[vars]
NEXT_PUBLIC_AI_WORKER_URL = "https://<YOUR_AI_WORKER_URL>" # Paste the URL here

# Bind the R2 bucket for static assets
[[r2_buckets]]
binding = "ASSETS"
bucket_name = "open-next-assets"
preview_bucket_name = "open-next-assets-preview"

# Bind a service for the AI worker (optional, for service bindings)
[[services]]
binding = "AI_WORKER"
service = "rgou-ai-worker"
```

### 2. Build and Deploy Frontend

From the project root directory, build the application and deploy it:

```bash
# Build the application using OpenNext
npm run build

# Deploy the worker to Cloudflare
wrangler deploy
```

OpenNext automatically handles building the Next.js app into a Cloudflare-compatible format. The `wrangler deploy` command uploads the worker and static assets to your Cloudflare account.

## 🧪 Verification

### 1. Test AI Worker

Send a request to your AI worker's health check endpoint:

```bash
curl https://<YOUR_AI_WORKER_URL>/health
```

You should receive a "healthy" status response.

### 2. Test Frontend

- Visit the URL for your main deployed application.
- Start a game and switch the AI source to "Server".
- Verify that the AI makes moves and that there are no errors in the browser console.

## 🔄 CI/CD Automation (GitHub Actions)

You can automate this process using GitHub Actions.

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy-ai-worker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - name: Deploy AI Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          wranglerVersion: "3"
          workingDirectory: "worker"
          command: deploy

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-ai-worker
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - name: Install Dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy Frontend
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          wranglerVersion: "3"
          command: deploy
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
