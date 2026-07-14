# Architecture diagrams

Graphviz/DOT sources and rendered PNGs live together in this directory. The `.dot` files are the source of truth; PNGs are committed so diagrams render consistently on GitHub and other documentation surfaces.

## Files

| Question                                                                                                      | Source                | Rendered              |
| ------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------- |
| Where does gameplay run, and which data crosses the edge boundary?                                            | `system-overview.dot` | `system-overview.png` |
| How does an AI result travel through the one lazy Worker, validation, stale guards, and centralized fallback? | `ai-turn-flow.dot`    | `ai-turn-flow.png`    |

Read the system overview first. Use the AI-turn diagram when changing game orchestration, `AIPosition`, the shared Worker client, model loading, WASM response validation, cache lifetime, or fallback behavior.

## Conventions

These diagrams use the same visual vocabulary as Antenna and swade-toolbox:

- Blue — browser UI and orchestration.
- Purple — pure domain or Rust/WASM computation.
- Yellow/orange — asynchronous boundaries and time-bounded work.
- Green — Cloudflare Worker code or a successful terminal state.
- Teal — browser or Cloudflare storage.
- Red — rejected, failed, invalid, or stale outcomes.
- Diamonds — decisions.
- Dashed edges — fallback or non-critical paths.
- Bold green outline — successful state-changing outcome.

Fonts use Avenir when available. PNGs render at 220 DPI.

Use Mermaid directly in Markdown for a small flow that remains clear without clusters, detailed edge labels, or careful layout. Use Graphviz when the diagram needs multiple boundaries, branches, or more than one kind of relationship. Keep each diagram focused on one architectural question.

## Render and verify

```bash
npm run diagrams
npm run check:diagrams
```

Both commands use Graphviz (`brew install graphviz`). `npm run diagrams` refreshes every committed PNG. The check verifies that each DOT source renders cleanly and has a corresponding PNG; CI installs Graphviz and runs this check through `npm run check`.

To render one diagram manually:

```bash
dot -Tpng:cairo docs/diagrams/system-overview.dot -Gdpi=220 -o docs/diagrams/system-overview.png
```
