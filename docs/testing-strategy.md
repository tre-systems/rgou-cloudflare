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

## Maintenance

- Add new tests to appropriate files
- Update tests when logic or schemas change
- Use clear naming: `should [expected behavior]`

## Best Practices

- Structure tests by feature and behavior
- Use data-testid for robust selectors in E2E
- Focus on business logic and integration

## See Also

- [Technical Implementation Guide](./technical-implementation.md)
- [AI System Documentation](./ai-system.md)
