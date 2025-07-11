# Architecture Overview

This document provides a detailed look into the architecture of the Royal Game of Ur project, focusing on its dual-AI engine, frontend application, and deployment strategy.

## Guiding Principles

The architecture was designed with the following goals in mind:

- **High Performance**: Utilize Rust and WebAssembly for CPU-intensive AI calculations.
- **Offline Capability**: The game must be fully playable without an internet connection.
- **Seamless User Experience**: The user should be able to switch between AI opponents without a noticeable difference in behavior.
- **Modern Tooling**: Leverage modern web development practices with Next.js, TypeScript, and a serverless backend on Cloudflare.
- **Maintainability**: Keep a clean separation of concerns between the UI, game logic, and AI services.

## Core Components

The project is primarily composed of three main parts:

1.  **Next.js Frontend**: A modern React-based application for the user interface and game state management.
2.  **Server-Side AI (Cloudflare Worker)**: A Rust-based AI that runs on Cloudflare's edge network. This serves as a fallback option.
3.  **Client-Side AI (WebAssembly)**: The same Rust AI logic compiled to WebAssembly (Wasm) to run directly in the user's browser. This is now the default opponent and provides an offline-capable experience.

A key aspect of this architecture is the **shared Rust AI core**, located in `worker/rust_ai_core`. This single crate contains all the game rules, board evaluation heuristics, and the AI's expectiminimax search algorithm. By sharing this code, we ensure that both the server and client AIs exhibit identical strategic behavior, with the only difference being their computational resources (search depth).

### 1. Frontend Application (`src/`)

The frontend is a Next.js 15 application using the App Router.

- **UI Components (`src/components/`)**: React components responsible for rendering the game board, controls, and other UI elements. They are built with Tailwind CSS for styling and Framer Motion for animations.
- **State Management (`src/lib/game-store.ts`)**: Global game state is managed by a Zustand store. This store holds the entire `GameState` and provides actions to manipulate it (e.g., `makeMove`, `processDiceRoll`). Using Immer middleware allows for safe and simple immutable state updates.
- **Game Logic (`src/lib/game-logic.ts`)**: This TypeScript module contains the rules of the game. It consists of pure functions that take the current game state and an action, and return the new game state. This logic is used for validating and applying player moves on the client side.
- **AI Services (`src/lib/ai-service.ts` & `src/lib/wasm-ai-service.ts`)**:
  - `ai-service.ts`: A simple client to communicate with the server-side Cloudflare Worker via a `fetch` request.
  - `wasm-ai-service.ts`: A service that interacts with the client-side WebAssembly AI. It loads the Wasm module and calls the exported `get_ai_move_wasm` function.

### 2. Dual-AI Engine (`worker/`)

The power of this project lies in its dual-AI engine, which provides flexibility and offline capabilities.

#### Server-Side AI (`worker/src/lib.rs`)

- **Technology**: A Cloudflare Worker written in Rust using the `workers-rs` crate.
- **Role**: It exposes a single API endpoint (`/ai-move`) that receives the current game state, computes the best move, and returns it.
- **Performance**: To keep response times low and adhere to serverless function execution limits, the server-side AI uses a **lower search depth** (e.g., depth 4). This makes it a slightly faster but weaker opponent, available as a fallback option.

#### Client-Side AI (`worker/rust_ai_core/src/wasm_api.rs`)

- **Technology**: The core Rust AI logic from `rgou-ai-core` is compiled to WebAssembly using `wasm-pack`.
- **Role**: It runs entirely in the user's browser, enabling instant AI responses and full offline gameplay. The Wasm module is loaded and managed by `src/lib/wasm-ai-service.ts`. This is now the default AI for the application.
- **Performance**: Since it runs on the user's machine, it can afford a **deeper search depth** (e.g., depth 6), making it the stronger of the two AI opponents.

### 3. Data Flow: An AI's Turn

When it's the AI's turn, the following sequence occurs:

1.  The `RoyalGameOfUr.tsx` component detects it's the AI's turn based on the `gameState` from the Zustand store.
2.  It calls the `makeAIMove` action in `game-store.ts`, passing the currently selected AI source (`'client'` by default).
3.  The `makeAIMove` action then calls the appropriate AI service:
    - **Client**: `wasmAiService.getAIMove` calls the Wasm function `get_ai_move_wasm`, passing it the game state. The Wasm module runs the AI calculation synchronously within the browser's main thread (or a worker thread, if implemented) and returns the result.
    - **Server**: `AIService.getAIMove` sends a POST request with the game state to the Cloudflare Worker. The worker deserializes the state, runs the Rust AI, and returns the chosen move.
4.  The chosen move is then processed by the `makeMoveLogic` function from `game-logic.ts` to update the board state in the Zustand store.
5.  The UI re-renders to reflect the AI's move.

## Deployment

The project is deployed entirely within the Cloudflare ecosystem.

- **Frontend**: The Next.js application is adapted for Cloudflare Pages using the `@opennextjs/cloudflare` build adapter.
- **AI Worker**: The server-side AI is deployed as a separate Cloudflare Worker. The frontend knows the worker's URL via an environment variable (`NEXT_PUBLIC_AI_WORKER_URL`).
- **Automation**: Deployment is automated through a GitHub Actions workflow defined in `.github/workflows/deploy.yml`, which builds the Next.js app and deploys it to Cloudflare Pages.

### WASM Security Headers

For the client-side WASM AI to work properly in the deployed environment, specific security headers are required. These are configured in the `public/_headers` file:

```
/wasm/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
```

These headers ensure that the WASM files can be loaded by web workers while maintaining security isolation. The `Cross-Origin-Embedder-Policy: require-corp` requires all resources to have the `Cross-Origin-Resource-Policy` header set, which is why all three headers are needed together.
