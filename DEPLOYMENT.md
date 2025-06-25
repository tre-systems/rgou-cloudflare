# 🚀 Deployment Guide - Royal Game of Ur

This guide walks you through deploying the Royal Game of Ur to Cloudflare Pages and Workers.

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
Set in Cloudflare Pages dashboard:

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

## 🌐 Deploy Frontend to Cloudflare Pages

### Option A: GitHub Integration (Recommended)

1. **Push to GitHub:**

   ```bash
   git add .
   git commit -m "Initial Royal Game of Ur implementation"
   git push origin main
   ```

2. **Connect to Cloudflare Pages:**

   - Go to Cloudflare Dashboard > Pages
   - Click "Create a project"
   - Connect your GitHub account
   - Select your repository
   - Configure build settings:
     - **Framework preset:** Next.js
     - **Build command:** `npm run build:cf`
     - **Build output directory:** `dist`

3. **Set Environment Variables:**
   In Pages dashboard > Settings > Environment variables:

   ```
   NEXT_PUBLIC_AI_WORKER_URL = https://your-worker-url.workers.dev
   ```

4. **Deploy:**
   - Click "Save and Deploy"
   - Wait for build to complete

### Option B: Direct Upload

1. **Build locally:**

   ```bash
   NEXT_PUBLIC_AI_WORKER_URL=https://your-worker-url.workers.dev npm run build:cf
   ```

2. **Deploy with Wrangler:**
   ```bash
   npx wrangler pages deploy dist --project-name=royal-game-of-ur
   ```

## 🔧 Configuration Details

### Worker Configuration

**wrangler.toml key settings:**

```toml
name = "rgou-ai-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = [ "nodejs_compat" ]

[vars]
ENVIRONMENT = "production"

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
  output: "export", // Static export for Pages
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: "dist",
  images: {
    unoptimized: true, // Required for static export
  },
};
```

## 🧪 Testing Deployment

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

- Visit your Pages URL
- Try both game modes (human vs human, human vs AI)
- Verify AI moves are working
- Check browser dev tools for any errors

## 🔄 Update Workflow

### Updating AI Worker

```bash
cd worker
# Make changes to src/
npm run build
npm run deploy
```

### Updating Frontend

**With GitHub integration:**

```bash
git add .
git commit -m "Update message"
git push origin main
# Pages will auto-deploy
```

**Direct upload:**

```bash
npm run build:cf
npx wrangler pages deploy dist --project-name=royal-game-of-ur
```

## 🌍 Custom Domain (Optional)

### 1. Add Domain to Cloudflare

- Add your domain to Cloudflare DNS
- Wait for nameserver propagation

### 2. Configure Pages Domain

- Pages dashboard > Custom domains
- Add your domain
- Configure CNAME record if needed

### 3. Configure Worker Route

In `wrangler.toml`:

```toml
[[routes]]
pattern = "api.yourdomain.com/*"
zone_name = "yourdomain.com"
```

Then update environment variable:

```bash
NEXT_PUBLIC_AI_WORKER_URL=https://api.yourdomain.com
```

## 🔒 Security Considerations

### Worker Security

- Environment variables for sensitive data
- CORS properly configured
- Rate limiting (implement if needed)
- Input validation on all endpoints

### Pages Security

- HTTPS only (automatic with Cloudflare)
- CSP headers (configure if needed)
- No sensitive data in client-side code

## 📊 Monitoring

### Cloudflare Analytics

- Worker analytics: Workers dashboard > Analytics
- Pages analytics: Pages dashboard > Analytics
- Real User Monitoring available

### Custom Monitoring

Add logging to worker:

```typescript
console.log("AI move request:", { gameState, move });
```

View logs:

```bash
wrangler tail rgou-ai-worker
```

## 🐛 Troubleshooting

### Common Issues

**Build Failures:**

```bash
# Clear Next.js cache
rm -rf .next
npm run build:cf
```

**Worker Not Responding:**

```bash
# Check worker logs
wrangler tail rgou-ai-worker
```

**CORS Issues:**
Verify worker headers include:

```typescript
'Access-Control-Allow-Origin': '*'
```

**Environment Variables Not Working:**

- Check variable names exactly match
- Restart development servers after changes
- Verify in Pages dashboard they're set correctly

### Getting Help

- Cloudflare Community: https://community.cloudflare.com/
- Workers Discord: https://discord.gg/cloudflaredev
- Cloudflare Docs: https://developers.cloudflare.com/

## 🎯 Performance Optimization

### Worker Optimization

- Minimize dependencies
- Use Zig for CPU-intensive AI calculations
- Implement caching for repeated game states

### Pages Optimization

- Static generation for fast loading
- Cloudflare CDN caching
- Image optimization (if adding images)

## 🔄 Rollback Strategy

### Worker Rollback

```bash
# Deploy previous version
wrangler deploy --compatibility-date=2023-12-01
```

### Pages Rollback

- Pages dashboard > Deployments
- Click "Rollback" on previous deployment

## 📈 Scaling Considerations

The current architecture handles:

- **Workers**: 100,000+ requests/day on free tier
- **Pages**: Unlimited bandwidth and requests
- **Edge locations**: Global distribution automatically

For higher traffic:

- Consider Worker KV for game state caching
- Implement Durable Objects for multiplayer games
- Add rate limiting and abuse protection

## ✅ Post-Deployment Checklist

- [ ] Worker health endpoint responding
- [ ] Frontend loads correctly
- [ ] AI moves working in browser
- [ ] Fallback AI working when worker unavailable
- [ ] Game rules working correctly
- [ ] Mobile responsiveness verified
- [ ] Performance testing completed
- [ ] Domain configured (if using custom domain)
- [ ] Monitoring setup
- [ ] Documentation updated with URLs

## Deploying the AI Worker

The AI worker is a separate application that needs to be deployed to Cloudflare Workers.

### 1. Configure `wrangler.toml`

Navigate to the `worker` directory and open `wrangler.toml`. You will need to uncomment and fill in your Cloudflare `account_id`.

```toml
# worker/wrangler.toml

# ... other config
# Uncomment and configure these when ready to deploy
account_id = "your-account-id"
# workers_dev = true
```

You may also want to configure routes if you are using a custom domain.

### 2. Set API Secret

The worker uses an `API_SECRET` environment variable for authentication. You need to set this secret in your Cloudflare Worker's settings.

```bash
cd worker
npx wrangler secret put API_SECRET
```

Wrangler will prompt you to enter the secret value.

### 3. Deploy the Worker

Once configured, you can deploy the worker using Wrangler:

```bash
cd worker
npx wrangler deploy
```

This command will build and deploy the worker to your Cloudflare account. The output will give you the URL of your deployed worker. This URL should be used as the `NEXT_PUBLIC_AI_API_URL` environment variable in your Next.js application deployment.
