# Royal Game of Ur - Architecture Overview

This document provides a high-level overview of the technical architecture for the Royal Game of Ur application. It's designed to be presented in approximately 15 minutes.

## 1. Core Philosophy

The application is built with a modern, robust, and performant tech stack. Key architectural goals include:

- **Type Safety:** Using TypeScript and Rust to catch errors at compile time.
- **Component-Based UI:** A reactive and maintainable frontend using React.
- **Centralized State Management:** A single source of truth for the application state.
- **Performant AI:** Providing a challenging AI opponent without compromising user experience.
- **Code Reusability:** Sharing code between the frontend and backend wherever possible.

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Browser
        A[Next.js/React Frontend] --> B{Zustand State Management};
        A --> C[Client-side AI (WebAssembly)];
        C --> D[Web Worker];
    end

    subgraph Cloudflare
        E[Cloudflare Worker (Rust)] --> F[Core AI Logic (Rust)];
    end

    A --"HTTP API Call"--> E;
    B --"Updates"--> A;

    style A fill:#f9f,stroke:#333,stroke-width:2px;
    style E fill:#f9f,stroke:#333,stroke-width:2px;
```

## 3. Technology Stack

- **Frontend:**
  - **Framework:** [Next.js](https://nextjs.org/) (with React)
  - **Language:** [TypeScript](https://www.typescriptlang.org/)
  - **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) (with Immer)
  - **Styling:** [Tailwind CSS](https://tailwindcss.com/)
  - **Animation:** [Framer Motion](https://www.framer.com/motion/)

- **Backend:**
  - **Platform:** [Cloudflare Workers](https://workers.cloudflare.com/)
  - **Language:** [Rust](https://www.rust-lang.org/)

- **AI Engine:**
  - **Language:** [Rust](https://www.rust-lang.org/)
  - **Deployment:** Compiled to both native code for the Cloudflare Worker and to [WebAssembly (WASM)](https://webassembly.org/) for the client.

- **Database:**
  - **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
  - **Database:** [SQLite](https://www.sqlite.org/index.html) (schema defined, but not fully integrated yet)

## 4. Frontend Architecture

The frontend is a Next.js application built with React and TypeScript.

- **`src/app`**: Contains the main page and layout, following Next.js App Router conventions.
- **`src/components`**: A collection of reusable React components. The main component is `RoyalGameOfUr.tsx`, which orchestrates the entire game. Other key components include `GameBoard.tsx` and `GameControls.tsx`.
- **`src/lib/game-store.ts`**: The heart of the frontend's state management. It uses Zustand to create a centralized store for the entire game state. This makes the state predictable and easy to debug. All game actions (like rolling dice or moving a piece) are dispatched from here.
- **`src/lib/game-logic.ts`**: This file contains the pure logic for the Royal Game of Ur. It has no dependencies on the UI or state management, making it highly portable and easy to test.

## 5. Backend & AI Architecture

A key feature of this application is its flexible and powerful AI. The AI logic is written once in Rust and deployed in two different ways, allowing the user to switch between them seamlessly.

### The Core AI Engine: `rust_ai_core`

- A Rust library containing the complete AI logic.
- It implements a **minimax algorithm** with alpha-beta pruning to determine the best move.
- It includes a transposition table to cache previously evaluated game states, significantly speeding up the search.
- This single codebase is the source of truth for all AI operations.

### Deployment Strategy 1: Server-Side AI (Cloudflare Worker)

- The `rust_ai_core` library is compiled to native Rust code and deployed as a **Cloudflare Worker**.
- It uses a fixed search depth of **4** to ensure it responds quickly and doesn't exceed the worker's CPU time limits.
- **Pros:** Consistent performance, doesn't tax the user's device. The AI's thinking process can't be easily inspected by the user.
- **Cons:** Requires an internet connection and introduces network latency. It is the **weaker** of the two AIs due to the lower search depth.
- The frontend communicates with this worker via a simple REST API, as defined in `src/lib/ai-service.ts`.

### Deployment Strategy 2: Client-Side AI (WebAssembly)

- The same `rust_ai_core` library is also compiled to **WebAssembly (WASM)**.
- It uses a higher search depth of **6**, making it the **stronger** and more challenging opponent.
- The WASM module is run in a **Web Worker** in the user's browser to avoid blocking the UI thread.
- **Pros:** No network latency, works offline. A great demonstration of modern web capabilities and the power of running complex computations on the client.
- **Cons:** Performance can vary depending on the user's device.
- The `src/lib/wasm-ai-service.ts` and `src/lib/ai.worker.ts` files manage the loading and execution of the WASM module.

This dual-deployment strategy is a sophisticated architectural choice that provides flexibility and showcases the power of Rust and WebAssembly.

## 6. Data Persistence

- The application uses **Drizzle ORM** to define a database schema in `src/lib/db/schema.ts`.
- The schema is designed to store game history, with tables for `games` and `game_participants`.
- **Current Status:** While the schema is defined, the application does not currently seem to be saving or loading game data. This functionality could be added in the future.

## 7. Key Features for Presentation

- **Dual AI System:** The ability to switch between server-side and client-side AI is the most significant technical feature. Be sure to demonstrate this.
- **AI Diagnostics Panel:** This UI component shows the AI's thought process (evaluation score, search depth, etc.), providing a fascinating look into how the AI works. This is a great feature to highlight during a presentation.
- **Polished UI/UX:** The application has a clean design, smooth animations (thanks to Framer Motion), and sound effects that create an engaging user experience.
- **Offline Capability:** Thanks to the client-side WASM AI, the game is fully playable offline (this would require a service worker to cache application assets, which seems to be in place with `public/sw.js`).

## 8. Potential Future Improvements

- **Full Database Integration:** Implement saving and loading of game histories.
- **Multiplayer:** The current architecture would support adding a multiplayer mode (e.g., using WebSockets).
- **AI Difficulty Levels:** The AI search depth is currently fixed. This could be exposed as a setting to allow for different difficulty levels.
- **User Accounts:** To associate game histories with specific users.

This overview should provide a solid foundation for your presentation. Good luck!
