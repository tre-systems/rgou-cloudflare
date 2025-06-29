# 🚀 Deployment Guide

This guide walks you through deploying the Royal Game of Ur application to Cloudflare. The project consists of a Next.js frontend and a Rust-based AI backend, both deployed as Cloudflare Workers.

## Prerequisites

Before you begin, ensure you have the following:

- A [Cloudflare account](https://dash.cloudflare.com/sign-up).
- The [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and authenticated.
- [Node.js](https://nodejs.org/) (version 20 or later) and npm.
- The [Rust toolchain](https://www.rust-lang.org/tools/install) (for AI worker development).
- `wasm-pack` for building WebAssembly modules from Rust.

```bash
# Install wasm-pack if you haven't already
cargo install wasm-pack
```

## 📦 Deployment Process

The entire application, both frontend and backend, can be deployed from the root of the project using npm scripts.

### Manual Deployment

To deploy the application manually, run the following commands from the project root:

1.  **Deploy the Frontend Worker:**

    ```bash
    npm run deploy:cf
    ```

    This command first builds the Next.js application into a static `out` directory and then deploys it as a Cloudflare Worker using the configuration in the root `wrangler.toml`.

2.  **Deploy the AI Worker:**

    ```bash
    npm run deploy:worker
    ```

    This command navigates into the `worker` directory and deploys the Rust-based AI worker using the configuration in `worker/wrangler.toml`.

### Automated Deployment with GitHub Actions

The deployment process is automated via a GitHub Action defined in `.github/workflows/deploy.yml`. A push to the `main` branch will automatically trigger the following steps:

1.  **Checkout Code:** The repository is checked out.
2.  **Set up Node.js and Rust:** The necessary toolchains are installed.
3.  **Install `wasm-pack`:** The WebAssembly packager is installed.
4.  **Build Wasm Assets:** The `build:wasm-assets` script is run to compile the Rust code to Wasm and place it where the Next.js app can find it.
5.  **Deploy Frontend and Backend:** The `deploy:cf` and `deploy:worker` scripts are run to deploy both parts of the application.

Here is the complete workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches:
      - main

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy to Cloudflare
    permissions:
      contents: read
      deployments: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm install

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install wasm-pack
        run: cargo install wasm-pack

      - name: Build Wasm Assets
        run: npm run build:wasm-assets

      - name: Deploy Frontend
        run: npm run deploy:cf
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Deploy AI Worker
        run: npm run deploy:worker
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## ⚙️ Configuration Files

### Frontend (`wrangler.toml`)

The root `wrangler.toml` file configures the Next.js frontend worker. It serves the static assets from the `./out` directory.

```toml
name = "rgou-main"
main = "worker.js"
compatibility_date = "2025-06-14"

[assets]
directory = "./out"

[vars]
ENVIRONMENT = "production"
NEXT_PUBLIC_AI_WORKER_URL = "https://rgou-minmax.tre.systems"
```

### AI Worker (`worker/wrangler.toml`)

The `worker/wrangler.toml` file configures the Rust-based AI worker. It specifies the build command required to compile the Rust code.

```toml
name = "rgou-ai-worker"
main = "build/worker/shim.mjs"
compatibility_date = "2024-12-01"

[build]
command = "cargo install -q worker-build && worker-build --release"
```

### Next.js (`next.config.mjs`)

The `next.config.mjs` is configured to export a static site, which is required for this type of Cloudflare Worker deployment.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};
```

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
