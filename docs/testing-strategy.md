# Testing Strategy

## Overview

| Test Type         | What to Test                | Tool       | Value  | Maintenance |
| ----------------- | --------------------------- | ---------- | ------ | ----------- |
| Pure logic        | Game rules, reducers        | Vitest     | High   | Low         |
| Schema validation | Zod schemas, domain types   | Vitest     | High   | Low         |
| Snapshots         | Key game states             | Vitest     | Medium | Low         |
| Store integration | Zustand actions/transitions | Vitest     | Medium | Medium      |
| UI smoke          | App loads, basic flows      | Playwright | Medium | Low         |
| Full E2E          | Full game, random flows     | Avoid      | Low    | High        |

## Philosophy

- Focus on high-value, low-maintenance tests
- Prefer deterministic, pure function tests
- Use integration tests for workflows
- Use snapshot tests for regression

## Test Categories

### 1. Unit Tests

- Location: `src/lib/__tests__/game-logic.test.ts`
- Test pure functions and business logic
- Fast, deterministic, high confidence

### 2. Schema Validation

- Location: `src/lib/__tests__/schemas.test.ts`
- Test Zod schemas and type safety
- Catches data issues early

### 3. Deterministic AI Tests

- Location: `src/lib/__tests__/ai-deterministic.test.ts`
- Test AI behavior in specific scenarios
- No randomness, verifies strategy

### 4. Integration Tests

- Location: `src/lib/__tests__/game-store.test.ts`
- Test game store, move sequences, AI integration, error handling

### 5. Snapshot Tests

- Location: `src/lib/__tests__/game-snapshots.test.ts`
- Catch regressions in key game states

### Rust Tests

- Location: `worker/rust_ai_core/src/lib.rs`, `worker/rust_ai_core/tests/`
- Test core AI and game logic

## What We DON'T Test

- Full game playthroughs (too slow, fragile)
- UI component tests (high maintenance, low value)
- Random dice roll tests (non-deterministic)
- Performance tests (environment-dependent)

## Running Tests

```bash
npm run test:watch      # Dev
npm run test            # CI/CD
npm run test:coverage   # Coverage
npm run check           # All checks (including Rust)
```

# End-to-End (E2E) Testing Strategy

Our E2E tests are implemented using Playwright and are located in the `e2e/` directory. The primary smoke test suite is `smoke.spec.ts`, which covers the following critical user flows:

- Mobile layout and main controls
- Landing page visibility and content
- Mode selection (Classic, ML, Watch)
- Game board interactivity (dice roll, piece movement, sound toggle, help panel)
- Game completion, stats, and database save verification
- Help panel accessibility

These tests ensure that the most important features of the application are always working as expected.

## Running E2E Tests

To run the E2E tests, use:

```
npm run test:e2e
```

## Diagnosing E2E Failures

For debugging and diagnosing issues when E2E tests fail, the following command is extremely helpful:

```
npm run test:e2e:ui
```

This launches the Playwright UI, allowing you to step through tests, inspect selectors, and view screenshots or traces of failures. Use this tool to quickly identify and resolve issues in the test suite or application.

## Notes

- E2E tests are designed to verify actual database saves (using local sqlite) rather than mocking database writes.
- Use `data-testid` attributes for robust and maintainable selectors.
- The smoke test suite is intended to cover the most critical flows; deeper or edge-case scenarios should be added to dedicated regression or feature-specific suites if needed.
