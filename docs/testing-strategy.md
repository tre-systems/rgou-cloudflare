# Testing Strategy

_Testing approach and methodology for the Royal Game of Ur project._

## Test Overview

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

### Unit Tests

- **Location**: `src/lib/__tests__/game-logic.test.ts`
- **Purpose**: Test pure functions and business logic
- **Benefits**: Fast, deterministic, high confidence

### Schema Validation

- **Location**: `src/lib/__tests__/schemas.test.ts`
- **Purpose**: Test Zod schemas and type safety
- **Benefits**: Catches data issues early

### AI Tests

- **Location**: `src/lib/__tests__/ai-deterministic.test.ts`
- **Purpose**: Test AI behavior in specific scenarios
- **Benefits**: No randomness, verifies strategy

### Integration Tests

- **Location**: `src/lib/__tests__/game-store.test.ts`
- **Purpose**: Test game store, move sequences, AI integration

### Rust Tests

- **Location**: `worker/rust_ai_core/src/lib.rs`, `worker/rust_ai_core/tests/`
- **Purpose**: Test core AI and game logic

## What We DON'T Test

- Full game playthroughs (too slow, fragile)
- UI component tests (high maintenance, low value)
- Random dice roll tests (non-deterministic)
- Performance tests (environment-dependent)

## Running Tests

```bash
# Development
npm run test:watch

# CI/CD
npm run test

# Coverage
npm run test:coverage

# All checks (including Rust)
npm run check
```

## E2E Testing

### Smoke Tests

- **Location**: `e2e/smoke.spec.ts`
- **Coverage**: Critical user flows, mobile layout, game completion
- **Database**: Verifies actual database saves (local SQLite)

### Running E2E

```bash
# Run E2E tests
npm run test:e2e

# Debug with UI
npm run test:e2e:ui
```

### Best Practices

- Use `data-testid` attributes for robust selectors
- Focus on critical flows, avoid edge cases
- Verify actual database saves, don't mock

## Related Documentation

- [Test Configuration Guide](./test-configuration-guide.md) - Test setup and configuration
- [Troubleshooting Guide](./troubleshooting.md) - Common test issues
