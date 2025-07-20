# Cloudflare Worker Infrastructure

This document explains the preserved Cloudflare Worker infrastructure and its potential future use cases.

## Overview

The project includes a complete Cloudflare Worker implementation in `worker/src/lib.rs` that provides server-side AI computation capabilities. While the current production system runs entirely client-side, this infrastructure is preserved for potential future use cases.

## Current Status

**Status**: Inactive (preserved for future use)  
**Location**: `worker/src/lib.rs`  
**Purpose**: Server-side AI computation and API endpoints

## Available Endpoints

### POST /ai-move

Processes AI move requests on the server side.

**Request Format**:

```json
{
  "current_player": "player1",
  "dice_roll": 4,
  "player1_pieces": [...],
  "player2_pieces": [...],
  "game_status": "playing"
}
```

**Response Format**:

```json
{
  "move": 2,
  "evaluation": 0.5,
  "thinking": "AI analysis details...",
  "diagnostics": {
    "search_depth": 3,
    "valid_moves": [0, 1, 2],
    "move_evaluations": [...],
    "transposition_hits": 150,
    "nodes_evaluated": 1000
  },
  "timings": {
    "ai_move_calculation": 15,
    "total_handler_time": 20
  }
}
```

### GET /health

Health check endpoint for monitoring and deployment verification.

**Response Format**:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "2.0.0-pure-rust"
}
```

## Configuration

### Environment Variables

- `ENVIRONMENT`: Controls CORS origins and logging verbosity
  - `production`: Restricts origins to production domains
  - `development`: Allows localhost origins for testing

### CORS Configuration

The worker automatically handles CORS headers based on the environment:

**Production**:

- Allowed origins: `https://rgou.tre.systems`, `https://www.rgou.tre.systems`

**Development**:

- Allowed origins: `http://localhost:3000`, `http://localhost:3001`, `http://127.0.0.1:3000`, `http://127.0.0.1:3001`

## Potential Future Use Cases

### 1. Server-Side Validation

Use server-side AI to validate client moves and prevent cheating in multiplayer scenarios.

**Benefits**:

- Ensures move validity
- Prevents client-side manipulation
- Provides authoritative game state

### 2. Analytics and Monitoring

Collect AI performance metrics and game statistics for analysis.

**Benefits**:

- Track AI performance over time
- Monitor user engagement patterns
- Identify areas for AI improvement

### 3. Multiplayer Support

Enable server-side AI for multiplayer games where client-side computation might be unreliable.

**Benefits**:

- Consistent AI performance across devices
- Reduced client-side resource requirements
- Centralized game state management

### 4. AI Model Distribution

Serve different AI models or configurations based on user preferences or device capabilities.

**Benefits**:

- Dynamic AI selection
- Device-specific optimizations
- A/B testing of AI improvements

## Reactivation Instructions

To reactivate server-side AI computation:

1. **Deploy the Worker**:

   ```bash
   cd worker
   wrangler deploy
   ```

2. **Update Frontend Configuration**:
   - Modify AI services to use server endpoints
   - Add fallback to client-side AI
   - Update CORS configuration

3. **Environment Setup**:
   - Set `ENVIRONMENT=production` for production deployment
   - Configure Cloudflare D1 database binding
   - Set up monitoring and logging

## Performance Considerations

### Advantages of Server-Side AI

- **Consistent Performance**: Server hardware is more predictable than client devices
- **Reduced Client Load**: Lower CPU/memory usage on client devices
- **Centralized Control**: Easier to update AI models and algorithms

### Disadvantages of Server-Side AI

- **Network Latency**: Additional round-trip time for each AI move
- **Infrastructure Costs**: Requires server resources and bandwidth
- **Offline Limitations**: Cannot function without internet connection
- **Scalability Concerns**: Server load increases with user count

## Current Decision

The project currently uses **client-side AI exclusively** because:

1. **Performance**: Eliminates network latency for AI moves
2. **Offline Capability**: Enables true offline play
3. **Cost Efficiency**: No server-side AI computation costs
4. **Simplicity**: Reduced infrastructure complexity
5. **User Experience**: Instant AI responses without network delays

The server-side infrastructure remains available for future scenarios where these trade-offs might be different.

## Monitoring and Maintenance

Even though the worker is inactive, it should be maintained to ensure it can be reactivated when needed:

- **Regular Updates**: Keep dependencies updated
- **Testing**: Verify worker functionality in development
- **Documentation**: Keep this documentation current
- **Security**: Monitor for security vulnerabilities

## Related Files

- `worker/src/lib.rs` - Main worker implementation
- `worker/Cargo.toml` - Rust dependencies
- `worker/rust_ai_core/` - Shared AI core library
- `src/lib/wasm-ai-service.ts` - Client-side AI service
- `src/lib/ml-ai-service.ts` - Client-side ML AI service
