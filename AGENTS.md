# Agent Instructions

These instructions apply to the whole repository. Keep changes simple, typed, tested, and documented.

## Reference Docs

Start with the local docs before making design or workflow decisions:

- `README.md` - project overview, setup, testing, and documentation index.
- `docs/DEVELOPMENT.md` - commands, testing strategy, troubleshooting, and CI.
- `docs/ARCHITECTURE.md` - app structure, data flow, persistence, deployment, and production behavior.
- `docs/AI-SYSTEM.md` - Classic AI, ML AI, Rust/WASM architecture, training, and model files.
- `docs/AI-MATRIX-RESULTS.md` - generated AI matchup and performance results.
- `docs/GAME-GUIDE.md` - game rules, strategy, and historical notes.
- `ml/README.md` - ML training quick start.
- `worker/rust_ai_core/tests/README.md` - Rust AI test suite.
- `.github/workflows/deploy.yml` and `wrangler.toml` - CI and Cloudflare deployment behavior.

Keep `README.md` and the relevant docs up to date when behavior, commands, setup, architecture, or deployment changes.

## Code Standards

- Prefer the simplest concise implementation that fits the existing architecture.
- Handle errors clearly without overcomplicating the flow.
- Fix lint, type-check, build, and test warnings instead of ignoring them.
- Strengthen linting and typing when the opportunity is directly related to the change.
- Keep domain types consolidated so the project has a strong shared domain model.
- Avoid duplicated types and duplicated domain logic.
- Use Immer in TypeScript where it helps avoid mutation.
- Use Zustand for React state management.
- Keep the game state machine simple, consolidated, and easy to reason about.
- Extract logic from UI components into `src/lib` so it can be unit tested.
- Use Rust where it is a natural fit, especially for game/AI logic.
- Use Python when it is the practical tool for scripts, analysis, or data work.
- Do not add a logging facility; `console` is fine. Log enough to diagnose problems without making output noisy.
- Remove pointless comments. Add comments only when they explain non-obvious behavior.
- Use blank lines to improve readability.

## Testing

- Keep test coverage high and proportional to risk.
- Use Vitest for unit tests.
- Use Playwright for end-to-end tests.
- Do not write unit tests for UI components.
- Add stable `data-testid` selectors to UI needed by e2e coverage.
- Run `npm run check` before pushing broad or risky changes.
- Use `caffeinate` for training and other long-running scripts.

## Security

- Server-side authorization and validation must live in routes, actions, and data-access code. Middleware or proxy checks are defense-in-depth only and must not be the only enforcement point.
- Validate server action payloads with shared schemas and keep size/range limits explicit.
- Treat dependency audit findings as blockers until upgraded, patched, or explicitly documented with a defensible mitigation.

## Project Hygiene

- Keep `.gitignore` current.
- Keep `.cursorignore` current, especially for large model files and build artifacts that slow indexing.
- Do not add an LLM, coding assistant, or other automated tool as a commit co-author.
- Keep docs concise and consolidate duplicated guidance where possible.
- When reviewing a file, check whether it should be split, whether the behavior belongs there, and whether the implementation can be simplified.

## User Shorthand

- `p` means proceed.
- `rcp` means review all changes in each file, remove pointless comments, make sure changes have automated tests, run `npm run check`, fix issues, analyze the results, update relevant documentation if there are no concerns, then `git add -A`, commit, and push all changed files.
- When asked to choose an approach, devise the best plan from repository context and proceed rather than presenting a menu of options.
