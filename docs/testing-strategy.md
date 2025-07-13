# Testing Strategy

## Testing Overview

| Test Type         | What to Test                | Tool       | Value  | Maintenance |
| ----------------- | --------------------------- | ---------- | ------ | ----------- |
| Pure logic        | Game rules, reducers        | Vitest     | High   | Low         |
| Schema validation | Zod schemas, domain types   | Vitest     | High   | Low         |
| Snapshots         | Key game states             | Vitest     | Medium | Low         |
| Store integration | Zustand actions/transitions | Vitest     | Medium | Medium      |
| UI smoke          | App loads, basic flows      | Playwright | Medium | Low         |
| Full E2E          | Full game, random flows     | Avoid      | Low    | High        |

---

This document outlines the comprehensive testing strategy for the Royal Game of Ur project, designed to provide confidence during refactoring while minimizing maintenance overhead.

## Testing Philosophy

Our testing approach prioritizes:

1. **High Value, Low Maintenance**: Focus on tests that catch real bugs without being fragile
2. **Deterministic Testing**: Avoid tests that depend on randomness or timing
3. **Pure Function Testing**: Test business logic in isolation
4. **Integration Testing**: Test complete workflows without full end-to-end complexity
5. **Snapshot Testing**: Catch unintended changes to critical game states

## Test Categories

### 1. Unit Tests (High Priority)

**Location**: `src/lib/__tests__/game-logic.test.ts`

**Purpose**: Test pure functions and business logic in isolation

**Coverage**:

- Game initialization
- Move validation
- Game state transitions
- Rule enforcement (captures, rosettes, finishes)
- Dice roll processing

**Benefits**:

- Fast execution (< 1 second)
- Deterministic results
- Easy to debug
- High confidence in core logic

**Example**:

```typescript
it('should allow capture of opponent piece', () => {
  const game = initializeGame();
  game.player1Pieces[0].square = 4;
  game.board[4] = game.player1Pieces[0];
  game.player2Pieces[0].square = 6;
  game.board[6] = game.player2Pieces[0];
  game.diceRoll = 2;

  const moves = getValidMoves(game);
  expect(moves).toContain(0);
});
```

### 2. Schema Validation Tests (High Priority)

**Location**: `src/lib/__tests__/schemas.test.ts`

**Purpose**: Ensure data validation works correctly

**Coverage**:

- Zod schema validation
- Type safety enforcement
- Invalid data rejection

**Benefits**:

- Catches data corruption early
- Ensures API contract compliance
- Prevents runtime errors

### 3. Deterministic AI Tests (Medium Priority)

**Location**: `src/lib/__tests__/ai-deterministic.test.ts`

**Purpose**: Test AI behavior in specific scenarios without randomness

**Coverage**:

- Winning move detection
- Strategic decision making
- Move evaluation consistency

**Benefits**:

- Tests AI logic without full games
- Verifies strategic behavior
- Mocks external dependencies

**Example**:

```typescript
it('should choose winning move when available', async () => {
  // Set up winning scenario
  // Mock AI response
  // Verify correct move selection
});
```

### 4. Integration Tests (Medium Priority)

**Location**: `src/lib/__tests__/game-store.test.ts`

**Purpose**: Test complete game workflows

**Coverage**:

- Game store state management
- Complete move sequences
- AI integration
- Error handling

**Benefits**:

- Tests real user workflows
- Catches integration bugs
- Verifies state management

### 5. Snapshot Tests (Low Priority)

**Location**: `src/lib/__tests__/game-snapshots.test.ts`

**Purpose**: Catch unintended changes to critical game states

**Coverage**:

- Initial game state
- Key game scenarios
- Edge cases

**Benefits**:

- Catches regressions automatically
- Documents expected behavior
- Low maintenance

## Rust Tests

**Location**: `worker/rust_ai_core/src/lib.rs` and `worker/rust_ai_core/tests/`

**Purpose**: Test core AI algorithm and game logic

**Coverage**:

- Game state management
- Move validation
- AI evaluation function
- AI vs AI simulation

## What We DON'T Test

### 1. Full Game Playthroughs

**Why**: Too slow, fragile, and low value

**Alternative**: Test individual game components and use AI simulation tests

### 2. UI Component Tests

**Why**: High maintenance, low value for game logic

**Alternative**: Focus on business logic and integration tests

### 3. Random Dice Roll Tests

**Why**: Non-deterministic, hard to debug

**Alternative**: Test with fixed dice rolls and edge cases

### 4. Performance Tests

**Why**: Environment-dependent, fragile

**Alternative**: Use AI simulation tests for performance validation

## Running Tests

### Development

```bash
npm run test:watch
```

### CI/CD

```bash
npm run test
```

### Coverage Report

```bash
npm run test:coverage
```

### All Checks (Including Rust)

```bash
npm run check
```

## Test Maintenance

### Adding New Tests

1. **Unit Tests**: Add to existing test files or create new ones in `src/lib/__tests__/`
2. **Integration Tests**: Add to `game-store.test.ts` for store-related tests
3. **Schema Tests**: Add to `schemas.test.ts` for new schemas
4. **Snapshot Tests**: Add to `game-snapshots.test.ts` for new scenarios

### Updating Tests

1. **Unit Tests**: Update when business logic changes
2. **Schema Tests**: Update when schemas change
3. **Snapshot Tests**: Review and update snapshots when behavior changes intentionally
4. **Integration Tests**: Update when store API changes

### Test Naming Conventions

- **Unit Tests**: `should [expected behavior]`
- **Integration Tests**: `should [workflow description]`
- **Snapshot Tests**: `should match [scenario] snapshot`

## Best Practices

### 1. Test Structure

```typescript
describe('Feature', () => {
  describe('Specific Behavior', () => {
    it('should do something specific', () => {
      // Arrange
      const input = setupScenario();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### 2. Test Data

- Use factory functions for complex test data
- Keep test data minimal and focused
- Use descriptive variable names

### 3. Mocking

- Mock external dependencies (WASM, API calls)
- Don't mock internal business logic
- Use consistent mock patterns

### 4. Assertions

- Test one thing per test
- Use descriptive assertion messages
- Prefer specific assertions over generic ones

## Continuous Integration

Tests are run automatically on:

1. **Pull Requests**: All tests must pass
2. **Main Branch**: Full test suite including Rust tests
3. **Deployment**: Pre-deployment verification

## Coverage Goals

- **Unit Tests**: > 90% coverage of business logic
- **Integration Tests**: > 80% coverage of user workflows
- **Schema Tests**: 100% coverage of validation logic
- **Overall**: > 85% coverage excluding UI components

## Troubleshooting

### Common Issues

1. **Test Flakiness**: Usually indicates timing or async issues
2. **Mock Failures**: Check mock setup and cleanup
3. **Snapshot Failures**: Review changes and update if intentional
4. **Performance Issues**: Check for unnecessary test setup

### Debugging

1. **Unit Tests**: Use `console.log` or debugger
2. **Integration Tests**: Check store state and mock calls
3. **Snapshot Tests**: Compare actual vs expected output

## Future Enhancements

### Potential Additions

1. **Property-Based Testing**: Using libraries like fast-check
2. **Visual Regression Tests**: For UI components
3. **Performance Benchmarks**: For AI algorithm
4. **Contract Tests**: For API endpoints

### Monitoring

1. **Test Execution Time**: Monitor for performance degradation
2. **Coverage Trends**: Track coverage over time
3. **Flaky Test Detection**: Identify and fix unstable tests
4. **Test Maintenance**: Regular review and cleanup

## Conclusion

This testing strategy provides a solid foundation for confident refactoring while keeping maintenance overhead manageable. The focus on deterministic, high-value tests ensures that the test suite remains a valuable asset rather than a burden.

The combination of unit tests, integration tests, and snapshot tests provides comprehensive coverage of the game logic while avoiding the pitfalls of fragile, time-consuming tests.
